from fastapi import APIRouter
from fastapi import Query

from services.restaurant_service import (
    RestaurantService
)

router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"]
)

restaurant_service = (
    RestaurantService()
)


@router.get("/")
async def get_restaurants(

    limit: int = 50,

    max_price: int | None = None,

    context_tags: list[str] | None = Query(
        default=None
    ),

    environment_tags: list[str] | None = Query(
        default=None
    )

):

    filters = {
        "max_price": max_price,
        "context_tags": context_tags,
        "environment_tags": environment_tags
    }

    return await restaurant_service.get_restaurants(
        limit=limit,
        filters=filters
    )


@router.get("/{restaurant_id}")
async def get_restaurant_detail(
    restaurant_id: str
):

    return (
        await restaurant_service
        .get_restaurant_detail(
            restaurant_id
        )
    )


@router.get("/{restaurant_id}/menu")
async def get_restaurant_menu(
    restaurant_id: str
):

    return (
        await restaurant_service
        .get_restaurant_menu(
            restaurant_id
        )
    )