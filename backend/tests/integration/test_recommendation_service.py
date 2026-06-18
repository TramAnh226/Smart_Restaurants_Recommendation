import pytest

from services.recommendation_service import (
    RecommendationService
)

@pytest.mark.asyncio
async def test_recommendation_flow():

    service = RecommendationService()

    result = await service.get_recommendation(
        text="đồ ăn cay"
    )

    assert len(
        result["restaurants"]
    ) > 0