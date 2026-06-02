from auth.supabase_client import supabase


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