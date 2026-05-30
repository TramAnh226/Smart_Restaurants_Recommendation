from fastapi import APIRouter

from services.history_service import HistoryService

router = APIRouter(
    prefix="/history",
    tags=["History"]
)

service = HistoryService()


@router.get("/{user_id}")
async def get_history(
    user_id: str
):
    return await service.get_history(user_id)


@router.post("/")
async def save_history(
    payload: dict
):
    return await service.save_history(payload)