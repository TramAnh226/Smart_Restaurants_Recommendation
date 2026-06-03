from services.ai_service import AIService
from services.recommendation_service import RecommendationService


class ChatbotService:

    def __init__(self):

        self.ai=AIService()

        self.recommendation=RecommendationService()


    async def chat(
        self,
        query:str,
        budget:int|None=None,
        latitude:float|None=None,
        longitude:float|None=None
    ):

        ai_response = await self.ai.generate_reply(query)

        recommendations=await self.recommendation.get_recommendation(
            query,
            budget,
            latitude,
            longitude
        )

        return {
            "response":ai_response,
            "recommendations":recommendations
        }