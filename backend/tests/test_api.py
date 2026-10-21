from fastapi.testclient import TestClient

from app.main import app


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
        response = client.post(
            "/api/v1/ai/chat",
            json={"messages": [{"role": "user", "content": "I need an outfit for a wedding"}]},
        )
        assert response.status_code == 200
        body = response.json()
        assert "gallery" in body["message"].lower()
        assert "confirmed" in body["message"].lower()
        assert body["mode"] == "catalogue_retrieval"
