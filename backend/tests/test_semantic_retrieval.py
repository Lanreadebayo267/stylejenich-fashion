import numpy as np

from backend.app.models import Product
from backend.app.semantic_retrieval import (
    rank_semantically,
    semantic_search_enabled,
)


def _product(name: str, category: str, tags: str) -> Product:
    return Product(
        id=name.lower().replace(" ", "-"),
        name=name,
        category=category,
        tags_csv=tags,
        image_url="/images/test.jpg",
    )


def test_semantic_search_is_opt_in_by_default(monkeypatch):
    monkeypatch.delenv("STYLEJENICH_SEMANTIC_SEARCH", raising=False)

    assert semantic_search_enabled() is False

    products = [
        _product("Evening Elegance", "dress", "formal,evening")
    ]

    assert rank_semantically("a classy dinner outfit", products) is None


def test_semantic_search_can_be_enabled(monkeypatch):
    monkeypatch.setenv("STYLEJENICH_SEMANTIC_SEARCH", "1")

    assert semantic_search_enabled() is True


def test_unverified_description_is_not_in_embedding_document():
    from backend.app.semantic_retrieval import _product_text

    product = _product("Garden Party", "dress", "floral,occasion")
    product.description = "An owner-unverified caption"
    product.metadata_verified = False

    document = _product_text(product)

    assert "Garden Party" in document
    assert "occasion" in document
    assert "owner-unverified" not in document


def test_model_failure_falls_back_to_keyword_search(monkeypatch):
    import backend.app.semantic_retrieval as semantic

    monkeypatch.setenv("STYLEJENICH_SEMANTIC_SEARCH", "1")
    monkeypatch.setattr(
        semantic,
        "_load_model",
        lambda: (_ for _ in ()).throw(RuntimeError("model unavailable")),
    )

    products = [
        _product("Evening Elegance", "dress", "formal,evening")
    ]

    assert semantic.rank_semantically(
        "a classy dinner outfit",
        products,
    ) is None


class FakeEmbeddingModel:
    """Return predictable vectors based on each product's text."""

    def encode(self, texts, **kwargs):
        vectors = []

        for text in texts:
            if text == "an elegant evening outfit":
                vectors.append([1.0, 0.0])
            elif "Evening Elegance" in text:
                vectors.append([0.9, 0.1])
            else:
                vectors.append([0.0, 1.0])

        return np.array(vectors)


def test_semantic_search_ranks_relevant_products_first(monkeypatch):
    monkeypatch.setenv("STYLEJENICH_SEMANTIC_SEARCH", "1")

    monkeypatch.setattr(
        "backend.app.semantic_retrieval._load_model",
        lambda: FakeEmbeddingModel(),
    )

    relevant = Product(
        id="evening-elegance",
        name="Evening Elegance",
        category="dress",
        image_url="/images/evening-elegance.jpg",
        tags_csv="formal,evening,occasion",
        metadata_verified=False,
    )

    unrelated = Product(
        id="casual-design",
        name="Casual Design",
        category="casual",
        image_url="/images/casual-design.jpg",
        tags_csv="casual,daywear",
        metadata_verified=False,
    )

    results = rank_semantically(
        "an elegant evening outfit",
        [unrelated, relevant],
    )

    assert results is not None
    assert len(results) == 1
    assert results[0][0].name == "Evening Elegance"
    assert results[0][1] > 0.22