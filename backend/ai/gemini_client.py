import json
import google.generativeai as genai

from config import settings

genai.configure(
    api_key=settings.GEMINI_API_KEY
)

model = genai.GenerativeModel(
    settings.AI_MODEL
)


class AIService:

    async def extract_intent(
        self,
        query: str
    ):

        prompt = f"""
        Extract restaurant recommendation tags.

        Return JSON only.

        {{
            "taste_tags": [],
            "context_tags": [],
            "style_tags": []
        }}

        User:
        {query}
        """

        response = model.generate_content(
            prompt
        )

        try:
            return json.loads(
                response.text
            )

        except Exception:

            return {
                "taste_tags": [],
                "context_tags": [],
                "style_tags": []
            }