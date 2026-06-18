import pytest

from repositories.restaurant_repository import (
    RestaurantRepository
)

@pytest.mark.asyncio
async def test_get_restaurants():

    repo = RestaurantRepository()

    restaurants = (
        await repo.get_all_restaurants()
    )

    assert len(restaurants) > 0