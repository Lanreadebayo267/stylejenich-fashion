from unittest.mock import patch

from sqlmodel import Session, SQLModel, create_engine

from backend.app import catalogue
from backend.app.models import Product


def test_empty_semantic_results_fall_back_to_keyword_search():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        product = Product(
            id="evening-elegance",
            name="Evening Elegance",
            category="dress",
            image_url="/images/evening-elegance.jpg",
            tags_csv="formal,evening,occasion",
            metadata_verified=False,
        )
        session.add(product)
        session.commit()

        # Simulate semantic search running but returning no matches.
        with patch(
            "backend.app.semantic_retrieval.rank_semantically",
            return_value=[],
        ):
            results = catalogue.list_products(
                session,
                query="classy evening dress",
            )

        assert [item.name for item in results] == ["Evening Elegance"]