from auth.supabase_client import supabase


class RestaurantRepository:

    async def get_all_restaurants(
        self
    ):

        result = (
            supabase
            .table("restaurant")
            .select("*")
            .execute()
        )

        return result.data

    async def get_restaurant_by_id(
        self,
        restaurant_id: str
    ):

        result = (
            supabase
            .table("restaurant")
            .select("*")
            .eq(
                "id",
                restaurant_id
            )
            .single()
            .execute()
        )

        return result.data

    async def get_menu_by_restaurant(
        self,
        restaurant_id: str
    ):

        result = (
            supabase
            .table("menu")
            .select("*")
            .eq(
                "restaurant_id",
                restaurant_id
            )
            .execute()
        )

        return result.data
    
    async def get_restaurants_filtered(
        self,
        filters: dict
    ):

        query = (
            supabase
            .table("restaurant")
            .select("*")
        )

        if filters.get("max_price"):

            query = query.lte(
                "price_lowest",
                filters["max_price"]
            )

        result = query.execute()

        restaurants = result.data

        filtered = []

        for restaurant in restaurants:

            passed = True

            if filters.get("context_tags"):

                if not any(
                    tag in (
                        restaurant.get(
                            "context_tags",
                            []
                        )
                    )
                    for tag in filters["context_tags"]
                ):
                    passed = False

        if filters.get("environment_tags"):

            if not any(
                tag in (
                    restaurant.get(
                        "environment_tags",
                        []
                    )
                )
                for tag in filters["environment_tags"]
            ):
                passed = False

        if filters.get("taste_tags"):

            if not any(
                tag in (
                    restaurant.get(
                        "taste_tags",
                        []
                    )
                )
                for tag in filters["taste_tags"]
            ):
                passed = False

        if filters.get("style_tags"):

            if not any(
                tag in (
                    restaurant.get(
                        "style_tags",
                        []
                    )
                )
                for tag in filters["style_tags"]
            ):
                passed = False

        if passed:
            filtered.append(
                restaurant
            )

        return filtered