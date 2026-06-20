import json
import asyncio
import google.generativeai as genai

from config import settings

genai.configure(
    api_key=settings.GEMINI_API_KEY
)

model = genai.GenerativeModel(
    settings.AI_MODEL
)


class AIService:

    async def generate_response(
        self,
        query,
        features,
        restaurants
    ):

        prompt = f"""
        Bạn là chatbot tư vấn nhà hàng.

        Người dùng hỏi:

        {query}

        NLP đã phân tích:

        {json.dumps(features, ensure_ascii=False)}

        Top nhà hàng:

        {json.dumps(restaurants[:3], ensure_ascii=False)}

        Viết phản hồi ngắn gọn 2 câu.
        """

        response = await asyncio.to_thread(
            model.generate_content,
            prompt
        )

        return response.text