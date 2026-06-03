from auth.supabase_client import supabase


class UserRepository:

    async def get_user(
        self,
        user_id: str
    ):

        result = (
            supabase
            .table("users")
            .select("*")
            .eq(
                "id",
                user_id
            )
            .single()
            .execute()
        )

        return result.data

    async def update_user(
        self,
        user_id: str,
        data: dict
    ):

        result = (
            supabase
            .table("users")
            .update(data)
            .eq(
                "id",
                user_id
            )
            .execute()
        )

        return result.data

    async def update_preferences(
        self,
        user_id: str,
        taste_preferences=None,
        allergy_preferences=None,
        preferred_countries=None,
        preferred_styles=None
    ):

        payload = {}

        if taste_preferences is not None:
            payload["taste_preferences"] = taste_preferences

        if allergy_preferences is not None:
            payload["allergy_preferences"] = allergy_preferences

        if preferred_countries is not None:
            payload["preferred_countries"] = preferred_countries

        if preferred_styles is not None:
            payload["preferred_styles"] = preferred_styles

        result = (
            supabase
            .table("users")
            .update(payload)
            .eq(
                "id",
                user_id
            )
            .execute()
        )

        return result.data