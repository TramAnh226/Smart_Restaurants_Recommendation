from auth.supabase_client import supabase


class FavoriteRepository:

    async def add_favorite(
        self,
        data: dict
    ):

        result = (
            supabase
            .table("favorites")
            .insert(data)
            .execute()
        )

        return result.data

    async def remove_favorite(
        self,
        favorite_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .delete()
            .eq(
                "id",
                favorite_id
            )
            .execute()
        )

        return result.data

    async def get_user_favorites(
        self,
        user_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .select("*")
            .eq(
                "user_id",
                user_id
            )
            .order(
                "created_at",
                desc=True
            )
            .execute()
        )

        return result.data

    async def is_favorite_restaurant(
        self,
        user_id: str,
        restaurant_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .select("*")
            .eq(
                "user_id",
                user_id
            )
            .eq(
                "restaurant_id",
                restaurant_id
            )
            .execute()
        )

        return len(result.data) > 0

    async def is_favorite_menu(
        self,
        user_id: str,
        menu_id: str
    ):

        result = (
            supabase
            .table("favorites")
            .select("*")
            .eq(
                "user_id",
                user_id
            )
            .eq(
                "menu_id",
                menu_id
            )
            .execute()
        )

        return len(result.data) > 0