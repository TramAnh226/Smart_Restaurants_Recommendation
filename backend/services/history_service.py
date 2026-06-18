from auth.supabase_client import supabase
from pydantic import BaseModel

class RecommendationHistoryCreate(BaseModel):
    user_id: str
    restaurant_id: str | None = None
    menu_id: str | None = None
    context: dict | None = None
    score: float | None = None
    reason: str | None = None
    action: str | None = None

class HistoryService:

    async def get_history(
        self,
        user_id: str
    ):

        result = (
            supabase
            .table("recommendation_history")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        return result.data

    async def save_history(
        self,
        payload: dict
    ):

        result = (
            supabase
            .table("recommendation_history")
            .insert(payload)
            .execute()
        )

        return result.data