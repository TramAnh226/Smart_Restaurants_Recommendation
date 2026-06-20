from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

def test_recommendation_api():

    response = client.post(
        "/recommendation/",
        json={
            "query":"đồ ăn cay"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "restaurants" in data