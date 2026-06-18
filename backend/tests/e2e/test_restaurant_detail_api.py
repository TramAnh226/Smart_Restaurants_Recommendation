from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

def test_restaurant_detail():

    response = client.get(
        "/restaurants"
    )

    assert response.status_code == 200