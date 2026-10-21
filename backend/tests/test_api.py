from fastapi.testclient import TestClient

from backend.app.main import app


def _chat(client: TestClient, message: str) -> dict:
    response = client.post(
        "/api/v1/ai/chat",
        json={"messages": [{"role": "user", "content": message}]},
    )
    assert response.status_code == 200
    return response.json()


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_products_endpoint_returns_structured_records():
    with TestClient(app) as client:
        response = client.get("/api/v1/products")
        assert response.status_code == 200
        products = response.json()
        assert products
        assert {"id", "name", "image_url", "price", "availability_status", "metadata_verified"} <= set(products[0])


def test_chat_uses_catalogue_and_discloses_unverified_data():
    with TestClient(app) as client:
        body = _chat(client, "I need an outfit for a wedding")
        assert "gallery" in body["message"].lower()
        assert "confirmed" in body["message"].lower()
        assert body["mode"] == "catalogue_retrieval"
        assert body["recommendations"]


def test_birthday_dinner_query_matches_existing_occasion_designs():
    with TestClient(app) as client:
        body = _chat(client, "Show me a simple, elegant outfit for a birthday dinner")
        assert "couldn't find a clear match" not in body["message"].lower()
        names = {item["name"] for item in body["recommendations"]}
        assert names.intersection({"Golden Hour", "Evening Elegance", "Garden Party"})


def test_price_and_size_question_does_not_return_unrelated_recommendations():
    with TestClient(app) as client:
        body = _chat(
            client,
            "How much does Evening Elegance cost, and is it available in my size?",
        )
        message = body["message"].lower()
        assert "evening elegance" in message
        assert "price has not been verified" in message
        assert "size availability" in message
        assert body["recommendations"] == []
        assert body["mode"] == "catalogue_metadata"


def test_generic_availability_question_is_honest_about_missing_data():
    with TestClient(app) as client:
        body = _chat(client, "What sizes are available?")
        assert "doesn't contain verified" in body["message"].lower()
        assert body["recommendations"] == []
        assert body["mode"] == "catalogue_metadata"
