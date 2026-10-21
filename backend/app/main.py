import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, create_engine, select

from .catalogue import list_products, recommend_products, seed_catalogue
from .intents import classify_intent
from .models import Product
from .schemas import ChatRequest, ChatResponse, ProductRead, ProductRecommendation

DATABASE_PATH = Path(__file__).resolve().parent.parent / "stylejenich.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS)

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
    version="0.2.0",
    description="Catalogue-backed fashion discovery API with deterministic intent routing. LLM/RAG integration is a later milestone.",
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
        (product for product in products if re.sub(r"[^a-z0-9]+", " ", product.name.lower()).strip() in normalized),
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


@app.post("/api/v1/ai/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
) -> ChatResponse:
    latest_user_message = next(
        (message.content.strip() for message in reversed(request.messages) if message.role == "user"),
        None,
    )
    if not latest_user_message:
        raise HTTPException(status_code=422, detail="Include at least one user message.")

    if classify_intent(latest_user_message) == "product_metadata":
        return ChatResponse(
            message=_metadata_answer(session, latest_user_message),
            recommendations=[],
            mode="catalogue_metadata",
        )

    products = recommend_products(session, latest_user_message, limit=3)
    if not products:
        return ChatResponse(
            message=(
                "I couldn't find a clear match in the current design gallery. "
                "Try describing the occasion, garment type, or style you have in mind. "
                "Prices, sizes, stock and delivery dates still need confirmation from StyleJenich."
            ),
            recommendations=[],
        )

    recommendations = [
        ProductRecommendation(
            product_id=product.id,
            name=product.name,
            image_url=product.image_url,
            reason="Matched using the design title or catalogue tags.",
        )
        for product in products
    ]
    lines = [
        "Here are a few designs from the current StyleJenich gallery that may be relevant:"
    ]
    for product in products:
        lines.append(f"• {product.name}")
    lines.append(
        "This first version uses catalogue keyword matching, not a generative LLM. "
        "Product descriptions are provisional, and prices, sizes, availability and lead times "
        "must be confirmed with StyleJenich before ordering."
    )
    return ChatResponse(message="\n\n".join(lines), recommendations=recommendations)
