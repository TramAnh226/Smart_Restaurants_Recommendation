from auth.supabase_client import supabase


class UserService:

    async def get_profile(
        self,
        user_id: str
    ):

        result = (
            supabase
            .table("users")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

        return result.data

    async def update_profile(
        self,
        user_id: str,
        payload: dict
    ):

        result = (
            supabase
            .table("users")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )

        return result.data