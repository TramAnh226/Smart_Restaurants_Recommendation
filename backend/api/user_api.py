from fastapi import APIRouter

from services.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

service = UserService()


@router.get("/{user_id}")
async def get_user(
    user_id: str
):
    return await service.get_profile(user_id)


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    payload: dict
):
    return await service.update_profile(
        user_id,
        payload
    )