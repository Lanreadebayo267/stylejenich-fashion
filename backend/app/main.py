import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, create_engine, select

from .catalogue import list_products, recommend_products, seed_catalogue
from .intents import classify_intent
from .llm import generate_gemini_reply
from .models import Product
from .schemas import ChatRequest, ChatResponse, ProductRead, ProductRecommendation

DATABASE_PATH = Path(__file__).resolve().parent.parent / "stylejenich.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=CONNECT_ARGS,
    pool_pre_ping=True,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


def get_session():
    with Session(engine) as session:
        yield session


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_catalogue(session)
    yield


app = FastAPI(
    title="StyleJenich AI API",
    version="0.3.0",
    description=(
        "Hybrid fashion concierge API. FastAPI owns business rules and catalogue "
        "retrieval; Gemini generates grounded customer-facing language."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "stylejenich-ai-api"}


@app.get("/api/v1/products", response_model=list[ProductRead])
def get_products(
    q: str | None = Query(default=None, max_length=160),
    category: str | None = Query(default=None, max_length=80),
    session: Session = Depends(get_session),
) -> list[ProductRead]:
    products = list_products(session, query=q, category=category)
    return [
        ProductRead(
            id=product.id,
            name=product.name,
            description=product.description,
            category=product.category,
            fabric=product.fabric,
            colour=product.colour,
            price=product.price,
            currency=product.currency,
            availability_status=product.availability_status,
            image_url=product.image_url,
            tags=product.tags,
            metadata_verified=product.metadata_verified,
        )
        for product in products
    ]


def _metadata_answer(session: Session, user_message: str) -> str:
    """Answer product-fact requests without pretending unknown facts are known."""
    normalized = re.sub(r"[^a-z0-9]+", " ", user_message.lower()).strip()
    products = list(session.exec(select(Product).order_by(Product.name)).all())
    matched = next(
        (
            product
            for product in products
            if re.sub(r"[^a-z0-9]+", " ", product.name.lower()).strip() in normalized
        ),
        None,
    )
    if matched:
        return (
            f"I found {matched.name} in the StyleJenich gallery, but its price has not been verified. "
            "The catalogue also doesn't currently contain confirmed size availability, stock status, "
            "or delivery lead times for this design. Please contact StyleJenich to confirm those details "
            "before ordering."
        )
    return (
        "I can help with product details, but the current catalogue doesn't contain verified pricing, "
        "size availability, stock status, or delivery lead times. Tell me the design name, then contact "
        "StyleJenich to confirm those details before ordering."
    )


def _retrieval_context(products: list[Product]) -> str:
    """Pass gallery labels to Gemini, never unverified product descriptions."""
    if not products:
        return ""
    lines = [
        "Possible gallery matches follow. These are search labels only; product attributes are unverified."
    ]
    for product in products:
        labels = product.tags_csv or "no search tags"
        lines.append(f"- Gallery name: {product.name}; search labels: {labels}")
    return "\n".join(lines)


def _fallback_message(products: list[Product]) -> str:
    if products:
        names = "\n".join(f"• {product.name}" for product in products)
        return (
            "These gallery designs may be worth exploring for your request:\n\n"
            f"{names}\n\n"
            "These are catalogue matches, not confirmation of fabric, colour, fit, price, "
            "size availability or stock. Please contact StyleJenich to confirm the design details."
        )
    return (
        "I can help you explore StyleJenich designs and custom-order enquiries. "
        "For a custom quote, the team needs your preferred style, fabric, measurements, "
        "and the date you need the outfit. For confirmed details, contact "
        "jennifer.adebayo@gmail.com or +234 803 328 5046."
    )


@app.post("/api/v1/ai/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
) -> ChatResponse:
    latest_user_message = next(
        (
            message.content.strip()
            for message in reversed(request.messages)
            if message.role == "user"
        ),
        None,
    )
    if not latest_user_message:
        raise HTTPException(status_code=422, detail="Include at least one user message.")

    # Pricing, size, stock and delivery questions bypass the language model.
    # This prevents the model from guessing facts that are not in the catalogue.
    if classify_intent(latest_user_message) == "product_metadata":
        return ChatResponse(
            message=_metadata_answer(session, latest_user_message),
            recommendations=[],
            mode="catalogue_metadata",
        )

    products = recommend_products(session, latest_user_message, limit=3)
    context = _retrieval_context(products)
    history = [
        {"role": message.role, "content": message.content}
        for message in request.messages
    ]

    # Gemini is optional in local development. If it is not configured or is
    # temporarily unavailable, the API still returns a safe catalogue response.
    generated_message = await generate_gemini_reply(history, context)
    if generated_message:
        recommendations = [
            ProductRecommendation(
                product_id=product.id,
                name=product.name,
                image_url=product.image_url,
                reason="Matched using the gallery name and catalogue search labels.",
            )
            for product in products
        ]
        return ChatResponse(
            message=generated_message,
            recommendations=recommendations,
            mode="gemini_rag",
        )

    return ChatResponse(
        message=_fallback_message(products),
        recommendations=[
            ProductRecommendation(
                product_id=product.id,
                name=product.name,
                image_url=product.image_url,
                reason="Matched using the gallery name and catalogue search labels.",
            )
            for product in products
        ],
        mode="catalogue_retrieval",
    )
