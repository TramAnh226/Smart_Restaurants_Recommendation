from fastapi import APIRouter

from services.favorite_service import FavoriteService

router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)

service = FavoriteService()


@router.get("/{user_id}")
async def get_favorites(
    user_id: str
):
    return await service.get_favorites(user_id)


@router.post("/")
async def add_favorite(
    payload: dict
):
    return await service.add_favorite(
        payload["user_id"],
        payload["restaurant_id"]
    )


@router.delete("/{favorite_id}")
async def delete_favorite(
    favorite_id: str
):
    return await service.delete_favorite(
        favorite_id
    )