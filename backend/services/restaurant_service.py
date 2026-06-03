from repositories.restaurant_repository import (
    RestaurantRepository
)


class RestaurantService:

    def __init__(self):

        self.repository = RestaurantRepository()

    async def get_restaurants(
        self,
        limit: int = 50,
        filters: dict | None = None
    ):

        restaurants = (
            await self.repository.get_all_restaurants()
        )

        if not filters:
            return restaurants[:limit]

        result = []

        for restaurant in restaurants:

            passed = True

            # ======================
            # Context
            # ======================

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

            # ======================
            # Environment
            # ======================

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

            # ======================
            # Price
            # ======================

            if filters.get("max_price"):

                lowest = restaurant.get(
                    "price_lowest"
                )

                if (
                    lowest is not None
                    and lowest > filters["max_price"]
                ):
                    passed = False

            if passed:
                result.append(
                    restaurant
                )

        return result[:limit]

    async def get_restaurant_detail(
        self,
        restaurant_id: str
    ):

        return (
            await self.repository
            .get_restaurant_by_id(
                restaurant_id
            )
        )

    async def get_restaurant_menu(
        self,
        restaurant_id: str
    ):

        return (
            await self.repository
            .get_menu_by_restaurant(
                restaurant_id
            )
        )