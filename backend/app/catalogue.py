import json
import re
from pathlib import Path

from sqlmodel import Session, select

from .models import Product

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "products.json"

STOP_WORDS = {
    "a", "an", "and", "are", "can", "do", "for", "have", "i", "in", "is",
    "it", "me", "my", "of", "on", "or", "the", "to", "what", "with", "you",
    "your", "tell", "about", "need", "want", "looking", "find", "show",
}

# Conservative query expansion maps customer language to existing catalogue
# tags/categories. It does not add unverified attributes to any product.
SYNONYMS = {
    "wedding": ["occasion", "formal", "gown", "dress"],
    "traditional": ["occasion", "formal", "gown", "dress"],
    "party": ["occasion", "evening", "dress"],
    "birthday": ["occasion", "evening", "cocktail", "dress"],
    "dinner": ["evening", "occasion", "cocktail"],
    "classy": ["formal", "occasion", "evening"],
    "elegant": ["formal", "occasion", "evening"],
    "simple": ["dress", "formal", "occasion"],
    "chic": ["casual", "formal", "occasion"],
    "work": ["workwear", "formal", "suit"],
    "office": ["workwear", "formal", "suit"],
}


def seed_catalogue(session: Session) -> None:
    """Seed once from the checked-in gallery manifest; never overwrite owner edits."""
    if session.exec(select(Product.id).limit(1)).first() is not None:
        return

    records = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for record in records:
        tags = record.pop("tags", [])
        product = Product(**record, tags_csv=",".join(tags))
        session.add(product)
    session.commit()


def list_products(session: Session, query: str | None = None, category: str | None = None) -> list[Product]:
    statement = select(Product)
    if category:
        statement = statement.where(Product.category == category.strip().lower())

    products = list(session.exec(statement.order_by(Product.name)).all())
    if not query or not query.strip():
        return products

    # Prefer local embedding similarity when explicitly enabled. If the
    # optional model is unavailable, rank_semantically returns None and the
    # existing deterministic keyword matcher remains the fallback.
    from .semantic_retrieval import rank_semantically

    semantic_results = rank_semantically(query, products)
    if semantic_results is not None:
        return [product for product, _score_value in semantic_results]

    terms = _tokens(query)
    if not terms:
        return products

    ranked = [
        (product, _score(product, terms))
        for product in products
    ]
    ranked = [(product, score) for product, score in ranked if score > 0]
    ranked.sort(key=lambda item: (-item[1], item[0].name.lower()))
    return [product for product, _ in ranked]


def recommend_products(session: Session, query: str, limit: int = 3) -> list[Product]:
    return list_products(session, query=query)[:limit]


def _tokens(text: str) -> list[str]:
    terms = re.findall(r"[a-z0-9]+", text.lower())
    expanded = list(terms)
    for term in terms:
        expanded.extend(SYNONYMS.get(term, []))
    # Preserve order while avoiding inflated scores from repeated synonyms.
    return list(dict.fromkeys(term for term in expanded if term not in STOP_WORDS))


def _score(product: Product, terms: list[str]) -> int:
    # Only owner-verified metadata should be used for descriptive matching.
    searchable = " ".join(
        [product.name, product.category, product.tags_csv]
        + ([product.description, product.fabric or "", product.colour or ""] if product.metadata_verified else [])
    ).lower()
    name = product.name.lower()
    return sum(2 if term in name else 1 for term in terms if term in searchable)
