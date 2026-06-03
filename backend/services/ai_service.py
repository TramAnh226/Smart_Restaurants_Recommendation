from ai.gemini_client import model


class AIService:

    async def generate_reply(
        self,
        query: str
    ):

        prompt = f"""
        Bạn là chatbot tư vấn ăn uống.

        Người dùng:
        {query}

        Trả lời ngắn gọn.
        """

        response = model.generate_content(prompt)

        return response.text