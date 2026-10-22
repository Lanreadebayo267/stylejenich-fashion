from backend.app.models import Product
from backend.app.semantic_retrieval import rank_semantically, semantic_search_enabled


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
    products = [_product("Evening Elegance", "dress", "formal,evening")]
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
