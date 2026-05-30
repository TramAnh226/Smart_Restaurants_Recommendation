from fastapi.testclient import TestClient
from app import app

client=TestClient(app)


def test_recommendation():

    payload={

        "budget":50000,

        "taste":["spicy"],

        "context":[
            "student_friendly"
        ]
    }

    response=client.post(
        "/recommendation",
        json=payload
    )

    assert response.status_code in [
        200,
        401
    ]