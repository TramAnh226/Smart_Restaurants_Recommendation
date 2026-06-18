from services.ai_service import AIService
from services.recommendation_service import RecommendationService


class ChatbotService:

    def __init__(self):
        self.ai = AIService()
        self.recommendation = RecommendationService()

    def build_fallback_reply(
        self,
        query,
        recommendations
    ):

        restaurants = (
            recommendations["restaurants"]["restaurants"]
        )

        text = f"Bạn đang tìm: {query}\n\n"

        text += "Một số gợi ý phù hợp:\n"

        for idx, restaurant in enumerate(
            restaurants,
            start=1
        ):
            text += (
                f"{idx}. {restaurant['name']} "
                f"(⭐ {restaurant['rating']})\n"
            )

        return text

    async def chat(
        self,
        query,
        budget=None,
        latitude=None,
        longitude=None
    ):

        recommendations = await self.recommendation.get_recommendation(
            query,
            budget,
            latitude,
            longitude
        )

        try:

            ai_reply = await self.ai.generate_reply(
                query,
                recommendations
            )

        except Exception:

            ai_reply = self.build_fallback_reply(
                query,
                recommendations
            )

        return {
            "message": ai_reply,
            "recommendations": recommendations
        }