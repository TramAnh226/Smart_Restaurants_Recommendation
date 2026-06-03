from auth.supabase_client import supabase


class HistoryRepository:

    async def create_history(
        self,
        data: dict
    ):

        result = (
            supabase
            .table("recommendation_history")
            .insert(data)
            .execute()
        )

        return result.data

    async def get_user_history(
        self,
        user_id: str,
        limit: int = 50
    ):

        result = (
            supabase
            .table("recommendation_history")
            .select("*")
            .eq(
                "user_id",
                user_id
            )
            .order(
                "created_at",
                desc=True
            )
            .limit(limit)
            .execute()
        )

        return result.data

    async def update_action(
        self,
        history_id: str,
        action: str
    ):

        result = (
            supabase
            .table("recommendation_history")
            .update(
                {
                    "action": action
                }
            )
            .eq(
                "id",
                history_id
            )
            .execute()
        )

        return result.data