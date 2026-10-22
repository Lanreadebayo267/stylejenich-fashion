"""Optional local embedding retrieval for the fashion catalogue.

Keyword retrieval remains the default and fallback. Enable embeddings by setting
STYLEJENICH_SEMANTIC_SEARCH=1 and installing requirements-semantic.txt.
The first enabled query may download the small model into the local Hugging Face cache.
"""
import logging
import os
from functools import lru_cache
from typing import Any

from .models import Product

logger = logging.getLogger(__name__)

_MODEL_NAME = os.getenv(
    "STYLEJENICH_EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)


def semantic_search_enabled() -> bool:
    return os.getenv("STYLEJENICH_SEMANTIC_SEARCH", "0").strip().lower() in {
        "1", "true", "yes", "on"
    }


@lru_cache(maxsize=1)
def _load_model() -> Any:
    # Import lazily so the basic API and test suite do not require this optional
    # dependency unless semantic retrieval is explicitly enabled.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(_MODEL_NAME, device="cpu")


def _product_text(product: Product) -> str:
    # Descriptions/fabric/colour are excluded until the owner verifies them.
    return " ".join(
        part for part in (
            product.name,
            product.category,
            product.tags_csv.replace(",", " "),
        ) if part
    )


def rank_semantically(query: str, products: list[Product]) -> list[tuple[Product, float]] | None:
    """Return cosine-ranked products, or None to request keyword fallback."""
    if not semantic_search_enabled() or not products or not query.strip():
        return None

    try:
        model = _load_model()
        texts = [query] + [_product_text(product) for product in products]
        vectors = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
        query_vector = vectors[0]
        ranked = [
            (product, float(query_vector @ vectors[index + 1]))
            for index, product in enumerate(products)
        ]
        ranked.sort(key=lambda item: (-item[1], item[0].name.lower()))
        # Reject weak matches instead of presenting unrelated designs as relevant.
        return [(product, score) for product, score in ranked if score >= 0.22]
    except Exception as exc:
        logger.warning(
            "Semantic retrieval unavailable; falling back to keyword matching (%s)",
            type(exc).__name__,
        )
        return None
