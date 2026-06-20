from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

def test_chatbot():

    response = client.post(
        "/chat/",
        json={
            "message":"đồ ăn cay"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "recommendations" in data