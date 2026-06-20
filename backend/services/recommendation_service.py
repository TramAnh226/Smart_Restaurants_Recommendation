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

from recommendation.food_tag_module import (
    extract_food_tags,
    expand_food_tags,
    FALLBACK_MAP
)



class RecommendationService:

    _restaurants_cache = None

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

    def _score_restaurant(
        self,
        restaurant: dict,
        food_tags: list,
        taste_tags: list,
        context_tags: list,
        weather: str | None,
        budget: float | None,
        latitude: float | None,
        longitude: float | None
    ) -> dict:
        weather_relevance = (
            self.calculate_weather_relevance(
                weather,
                restaurant
            )
            if weather
            else None
        )

        taste_tags_restaurant = (
            (restaurant.get("taste_tags") or []) 
            + (restaurant.get("cuisine_type") or [])
        )

        context_tags_restaurant = (
            (restaurant.get("context_tags") or []) 
            + (restaurant.get("style_tags") or []) 
            + (restaurant.get("environment_tags") or [])
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
                (latitude, longitude),
                (restaurant["latitude"], restaurant["longitude"])
            )

        scores = {
            "food": self.scorer.food_score(
                food_tags,
                restaurant.get("food_tags", [])
            ),
            "taste": self.scorer.taste_score(
                taste_tags,
                taste_tags_restaurant
            ),
            "context": self.scorer.context_score(
                context_tags,
                context_tags_restaurant
            ),
            "price": self.scorer.price_score(
                budget,
                restaurant.get("price_lowest")
            ),
            "rating": self.scorer.rating_score(
                restaurant.get("rating")
            ),
            "distance": distance_score,
            "weather": self.scorer.weather_score(
                weather_relevance
            ),
            "learning": learning_score
        }

        return scores


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

        ###### DEBUG #######

        # print("FEATURES =", features)

        taste_tags = features.get("taste_tags", []) + features.get("cuisine_type", [])
        context_tags = (
            features.get("context_tags", []) 
            + features.get("style_tags", []) 
            + features.get("environment_tags", [])
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

        if RecommendationService._restaurants_cache is None:
            restaurants = await self.repository.get_all_restaurants()
            
            # Sinh food_tags động từ dữ liệu đã có (và mở rộng thêm tag đơn thành phần để khớp fallback)
            for restaurant in restaurants:
                base_tags = extract_food_tags(restaurant["name"])
                restaurant["food_tags"] = expand_food_tags(base_tags)
            
            RecommendationService._restaurants_cache = restaurants
        else:
            restaurants = RecommendationService._restaurants_cache
        
        # --- Chiến lược Khớp Chính xác / Fallback ---
        query_food_tags = features.get("food_tags", [])
        query_multi_word_tags = [t for t in query_food_tags if t in FALLBACK_MAP]
        
        scored_restaurants = []

        if query_multi_word_tags:
            # 1. Tách danh sách nhà hàng thành hai phần: khớp chính xác và khớp một phần (fallback)
            exact_restaurants = [
                r for r in restaurants
                if any(t in (r.get("food_tags") or []) for t in query_multi_word_tags)
            ]
            partial_restaurants = [r for r in restaurants if r not in exact_restaurants]

            # 2. Chấm điểm nhóm khớp chính xác (sử dụng tag gốc của truy vấn)
            scored_exact = []
            for restaurant in exact_restaurants:
                scores = self._score_restaurant(
                    restaurant, query_food_tags, taste_tags, context_tags,
                    weather, budget, latitude, longitude
                )
                final_score = self.scorer.final_score(scores)
                scored_exact.append({
                    "restaurant": restaurant,
                    "score": final_score,
                    "reason": [self.scorer.explain_recommendation(scores)]
                })

            # 3. Chấm điểm nhóm khớp một phần (chuyển truy vấn thành fallback tags)
            fallback_tags = []
            for t in query_food_tags:
                if t in FALLBACK_MAP:
                    fallback_tags.extend(FALLBACK_MAP[t])
                else:
                    fallback_tags.append(t)
            fallback_tags = list(set(fallback_tags))

            scored_partial = []
            for restaurant in partial_restaurants:
                scores = self._score_restaurant(
                    restaurant, fallback_tags, taste_tags, context_tags,
                    weather, budget, latitude, longitude
                )
                final_score = self.scorer.final_score(scores)
                scored_partial.append({
                    "restaurant": restaurant,
                    "score": final_score,
                    "reason": [self.scorer.explain_recommendation(scores)]
                })

            # 4. Sắp xếp riêng từng nhóm rồi nối lại (đảm bảo khớp chính xác luôn được ưu tiên xếp đầu)
            scored_exact.sort(key=lambda x: x["score"], reverse=True)
            scored_partial.sort(key=lambda x: x["score"], reverse=True)
            scored_restaurants = scored_exact + scored_partial

        else:
            # Không có nhãn nhiều từ: Chấm điểm toàn bộ nhà hàng bình thường
            for restaurant in restaurants:
                scores = self._score_restaurant(
                    restaurant, query_food_tags, taste_tags, context_tags,
                    weather, budget, latitude, longitude
                )
                final_score = self.scorer.final_score(scores)
                scored_restaurants.append({
                    "restaurant": restaurant,
                    "score": final_score,
                    "reason": [self.scorer.explain_recommendation(scores)]
                })

        # ==========================
        # M6 Ranking
        # ==========================

        ranked = top_k(
            scored_restaurants,
            k=5
        )

        formatted_result = format_recommendation_output (
            ranked
        )

        return {
            "features": features,
            "restaurants": formatted_result
        }
    
