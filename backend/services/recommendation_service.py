from recommendation.nlp_module import extract_features

from recommendation.scoring_module import (
    RecommendationScorer
)

from recommendation.learning_module import (
    LearningModule
)

from recommendation.ranking_module import (
    top_k,
    format_recommendation_output
)

from services.weather_service import (
    WeatherService
)

from repositories.restaurant_repository import (
    RestaurantRepository
)



class RecommendationService:

    def __init__(self):

        self.repository = RestaurantRepository()

        self.scorer = RecommendationScorer()

        self.weather_service = WeatherService()

        self.learner = LearningModule()

    
    def calculate_weather_relevance(
        self,
        weather,
        restaurant
    ):

        env_tags = restaurant.get(
            "environment_tags"
        ) or []

        if weather == "Rain":

            if "indoor" in env_tags:
                return 3

            return 1

        if weather == "Clear":

            if "outdoor" in env_tags:
                return 3

            return 2

        return 2

    async def get_recommendation(
        self,
        text: str,
        budget: float | None = None,
        latitude: float | None = None,
        longitude: float | None = None 
    ):

        # ==========================
        # M3 NLP
        # ==========================

        features = extract_features(text)

        taste_tags = features.get(
            "taste_tags",
            []
        )

        context_tags = features.get(
            "context_tags",
            []
        )

        weather = None

        if (
            latitude is not None
            and longitude is not None
        ):

            try:

                weather_data = (
                    await self.weather_service.get_weather(
                        latitude,
                        longitude
                    )
                )

                weather = weather_data.get(
                    "weather"
                )

            except Exception:

                weather = None

        # ==========================
        # M4 Database
        # ==========================

        restaurants = await self.repository.get_all_restaurants()

        scored_restaurants = []

        # ==========================
        # M5 Scoring
        # ==========================

        for restaurant in restaurants:

            weather_relevance = (
                self.calculate_weather_relevance(
                    weather,
                    restaurant
                )
                if weather
                else None
            )

            taste_tags_restaurant = (
                restaurant.get("taste_tags")
                or []
            )

            context_tags_restaurant = (
                restaurant.get("context_tags")
                or []
            )

            learning_score = (
                self.learner.calculate_learning_score(
                    taste_tags_restaurant
                    +
                    context_tags_restaurant
                )
            )

            distance_score = None

            if (
                latitude is not None
                and longitude is not None
                and restaurant.get("latitude") is not None
                and restaurant.get("longitude") is not None
            ):

                distance_score = self.scorer.distance_score(
                    (
                        latitude,
                        longitude
                    ),
                    (
                        restaurant["latitude"],
                        restaurant["longitude"]
                    )
                )

           

            scores = {

                "taste":
                self.scorer.taste_score(
                    taste_tags,
                    restaurant.get(
                        "taste_tags",
                        []
                    )
                ),

                "context":
                self.scorer.context_score(
                    context_tags,
                    restaurant.get(
                        "context_tags",
                        []
                    )
                ),

                "price":
                self.scorer.price_score(
                    budget,
                    restaurant.get(
                        "price_lowest"
                    )
                ),

                "rating":
                self.scorer.rating_score(
                    restaurant.get(
                        "rating"
                    )
                ),

                "distance": 
                distance_score,

                "weather":
                self.scorer.weather_score(
                    weather_relevance
                ),

                "learning":
                learning_score

            }

            final_score = (
                self.scorer.final_score(
                    scores
                )
            )

            scored_restaurants.append(

                {
                    "restaurant":
                    restaurant,

                    "score":
                    final_score,

                    "reason":
                    [
                        self.scorer.explain_recommendation(
                            scores
                        )
                    ]
                }
            )

        # ==========================
        # M6 Ranking
        # ==========================

        ranked = top_k(
            scored_restaurants,
            k=5
        )

        return format_recommendation_output(
            ranked
        )