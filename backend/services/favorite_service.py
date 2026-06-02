from auth.supabase_client import supabase


class FavoriteService:

    async def get_favorites(
        self,
        user_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        return result.data

    async def add_favorite(
        self,
        user_id: str,
        restaurant_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .insert({
                "user_id": user_id,
                "restaurant_id": restaurant_id
            })
            .execute()
        )

        return result.data

    async def delete_favorite(
        self,
        favorite_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .delete()
            .eq("id", favorite_id)
            .execute()
        )

        return result.data