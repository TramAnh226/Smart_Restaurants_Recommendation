import json
import asyncio
from ai.gemini_client import model


class AIService:

    async def generate_reply(
        self,
        query: str
    ) -> str:
        """
        Phản hồi chung ngắn gọn cho các câu hỏi thông thường.
        """
        prompt = f"""
        Bạn là chatbot tư vấn ăn uống thân thiện.
        Người dùng: {query}
        Trả lời ngắn gọn và tự nhiên bằng tiếng Việt.
        """
        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"Lỗi trong generate_reply: {e}")
            return "Tôi có thể giúp gì cho bạn về chủ đề ăn uống?"

    async def generate_response(
        self,
        query: str,
        features: dict,
        restaurants: dict
    ) -> str:
        """
        Phản hồi tư vấn nhà hàng dựa trên phân tích NLP và kết quả từ recommendation core.
        """
        # Trích xuất danh sách nhà hàng từ dict hoặc list
        restaurant_list = []
        if isinstance(restaurants, dict):
            restaurant_list = restaurants.get("restaurants", [])
        elif isinstance(restaurants, list):
            restaurant_list = restaurants

        # Chỉ lấy top 3 nhà hàng tốt nhất để làm ngữ cảnh cho AI
        top_restaurants = restaurant_list[:3]

        prompt = f"""
        Bạn là một trợ lý tư vấn nhà hàng và ẩm thực thân thiện, nhiệt tình và am hiểu.
        Nhiệm vụ của bạn là phản hồi câu hỏi của người dùng bằng ngôn ngữ tự nhiên, ấm áp và chuyên nghiệp.

        YÊU CẦU:
        1. Phản hồi bằng tiếng Việt trôi chảy. Tránh cách nói máy móc, cộc lốc hoặc lặp lại cấu trúc cứng nhắc.
        2. Nếu có danh sách nhà hàng đề xuất:
           - Giới thiệu tóm tắt 2-3 nhà hàng phù hợp nhất.
           - Làm nổi bật lý do tại sao các nhà hàng này lại phù hợp với họ (sử dụng trường 'reason' và các tags có sẵn như taste, giá cả, không gian).
           - Trình bày một cách tự nhiên, hấp dẫn, khuyến khích sự tương tác.
        3. Nếu danh sách nhà hàng đề xuất trống:
           - Xin lỗi khách hàng một cách lịch sự vì chưa tìm thấy kết quả phù hợp.
           - Gợi ý họ thử thay đổi yêu cầu hoặc cung cấp thêm thông tin (vị trí, món ăn, khoảng giá).
        4. Giữ câu trả lời cô đọng nhưng đầy đủ thông tin (khoảng 3-5 câu), mang lại cảm giác thoải mái và tin cậy.

        NGƯỜI DÙNG HỎI:
        "{query}"

        THÔNG TIN HỆ THỐNG PHÂN TÍCH (NLP Tags):
        {json.dumps(features, ensure_ascii=False)}

        DANH SÁCH NHÀ HÀNG ĐỀ XUẤT TỪ CORE SYSTEM:
        {json.dumps(top_restaurants, ensure_ascii=False)}
        """

        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"Lỗi khi gọi Gemini trong AIService.generate_response: {e}")
            # Fallback message
            if top_restaurants:
                names = [r.get("restaurant", {}).get("name", "Nhà hàng không tên") for r in top_restaurants]
                return f"Chào bạn! Tôi đã tìm thấy một số địa điểm phù hợp cho bạn như: {', '.join(names)}. Hãy tham khảo thông tin chi tiết được hiển thị bên dưới nhé!"
            return "Xin lỗi bạn, tôi chưa thể kết nối với hệ thống AI vào lúc này. Bạn vui lòng thử lại sau nhé!"