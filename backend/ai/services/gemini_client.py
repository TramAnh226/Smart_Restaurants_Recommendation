import os
import json
from google import genai
from google.genai import types

# API Key lấy từ Google AI Studio của bạn
RAW_API_KEY = "AQ.Ab8RN6LzHXkW69uL6SPaNQ081OO8MNA-EZq-1hMcbmTB2Wvivg"
API_KEY = RAW_API_KEY.strip() if RAW_API_KEY else ""

class AIService:
    """Lớp xử lý trích xuất bộ 3 nhãn ý định (Intent Extraction & AI Tag Generation)"""
    def __init__(self, client, model_name):
        self.client = client
        self.model_name = model_name
        
    def extract_intent_tags(self, user_message: str) -> dict:
        if not user_message or not isinstance(user_message, str):
            return {"taste_tags": [], "context_tags": [], "style_tags": []}

        system_instruction = (
            "ROLE & MISSION:\n"
            "Bạn là bộ phận phân tích ngôn ngữ tự nhiên (Module M2 - AI & Chatbot) thuộc hệ thống gợi ý nhà hàng thông minh.\n"
            "Nhiệm vụ của bạn là đọc tin nhắn nhập vào của người dùng (User Message), bóc tách ý định thực sự và phân loại thành các nhãn (tags) tiếng Anh chuẩn.\n\n"
            
            "VALID TAGS POOL:\n"
            "1. taste_tags (Khẩu vị, ẩm thực, chế độ ăn, quốc gia, kiểu món):\n"
            "   - spicy, sweet, sour, savory, vegetarian (đồ chay), diet (ăn kiêng/keto/eat clean).\n"
            "   - vietnamese, korean, japanese, thai, western (đồ Âu), chinese.\n"
            "   - bbq (đồ nướng), hotpot (lẩu), seafood (hải sản), fastfood, dessert (bánh/chè/kem), cafe, noodles (bún/phở/mì).\n"
            "2. context_tags (Bối cảnh, không gian, đối tượng, tài chính):\n"
            "   - family, dating (hẹn hò), friends (tụ tập), solo (đi 1 mình), business (tiếp khách).\n"
            "   - relaxed (yên tĩnh), vibrant (náo nhiệt), chill, aesthetic (view đẹp/check-in), outdoor (vỉa hè/thoáng khí).\n"
            "   - luxury (sang trọng/cao cấp), student_friendly (bình dân/giá rẻ), budget.\n"
            "   - nightlife (ăn đêm/quán bar/nhậu), birthday.\n"
            "3. style_tags (Phong cách phục vụ của nhà hàng):\n"
            "   - street_food (ăn vặt/vỉa hè), buffet, fine_dining (cao cấp/bàn tiệc), cafe, pub_bar.\n\n"
            
            "EDGE CASES HANDLING RULES (QUY TẮC XỬ LÝ TRƯỜNG HỢP BIÊN):\n"
            "1. Từ lóng/Ẩn dụ (Slang): Tự động dịch nghĩa sang tag chuẩn (Ví dụ: 'làm vài ly', 'đi nhậu' -> context_tags: ['nightlife', 'friends']).\n"
            "2. Yêu cầu mâu thuẫn (Conflict): Nếu người dùng đòi hỏi hai thứ đối lập cùng lúc, giữ lại CẢ HAI tag (Ví dụ: 'đồ Nhật sang trọng giá sinh viên' -> taste_tags: ['japanese'], context_tags: ['luxury', 'student_friendly']).\n"
            "3. Tin nhắn không liên quan/Vô nghĩa: Nếu câu lệnh không chứa nhu cầu ăn uống (Ví dụ: 'alo', 'chào bạn'), trả về mảng rỗng [] cho tất cả các mục.\n"
            "4. Câu lệnh phủ định (Negative Intent): KHÔNG trích xuất những gì người dùng ghét, chỉ trích xuất những gì người dùng MUỐN (Ví dụ: 'thèm đồ Hàn, né chỗ ồn ào' -> taste_tags: ['korean'], context_tags: ['relaxed'] - TUYỆT ĐỐI KHÔNG lấy tag 'vibrant').\n"
            "5. Lan man/Kể chuyện (Verbose): Bỏ qua thông tin nhiễu, tập trung rút trích từ khóa cốt lõi quyết định hành vi đi ăn.\n\n"
            
            "REQUIRED JSON SCHEMA:\n"
            "{\n"
            "  \"taste_tags\": [list of matched taste tags],\n"
            "  \"context_tags\": [list of matched context tags],\n"
            "  \"style_tags\": [list of matched style tags]\n"
            "}\n"
            "CHỈ trả về duy nhất chuỗi JSON hợp lệ. KHÔNG bọc trong ```json ... ```, không giải thích thêm."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.1
                ),
            )
            result_json = json.loads(response.text.strip())
            for tag_type in ["taste_tags", "context_tags", "style_tags"]:
                if tag_type not in result_json: 
                    result_json[tag_type] = []
            return result_json
        except Exception as e:
            print(f"[M2 Error - AIService]: {e}")
            return {"taste_tags": [], "context_tags": [], "style_tags": []}

class ChatbotService:
    """Lớp xử lý luồng hội thoại và phản hồi (Chatbot Service - Conversation Flow & Memory)"""
    def __init__(self, client, model_name):
        self.client = client
        self.model_name = model_name
        
    def generate_chatbot_response(self, user_message: str, history: list = None) -> dict:
        system_instruction = (
            "Bạn là một Chatbot hỗ trợ gợi ý quán ăn thân thiện, nhiệt tình thuộc hệ thống Smart Restaurants Recommendation.\n"
            "Nhiệm vụ của bạn là trò chuyện tự nhiên, ghi nhận nhu cầu ăn uống của người dùng, "
            "và phản hồi một cách ngắn gọn, gợi mở (tối đa 2-3 câu). Không tự bịa tên nhà hàng/quán ăn cụ thể ở bước này.\n"
            "Bắt buộc trả về định dạng JSON duy nhất, không giải thích văn bản dư thừa.\n"
            "REQUIRED JSON SCHEMA: {\"reply\": \"nội dung câu trả lời của chatbot\"}"
        )
        contents = []
        if history:
            for msg in history:
                contents.append(types.Content(role=msg['role'], parts=[types.Part.from_text(text=msg['text'])]))
        contents.append(user_message)
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                ),
            )
            return json.loads(response.text.strip())
        except Exception as e:
            print(f"[M2 Error - ChatbotService]: {e}")
            return {"reply": "Xin lỗi bạn, hệ thống AI của mình đang bận xử lý dữ liệu một chút. Bạn nói lại yêu cầu được không?"}

class GeminiClientService:
    """Khối quản lý chung (Core Client) liên kết toàn bộ Module M2"""
    def __init__(self):
        self.client = genai.Client(api_key=API_KEY)
        self.model_name = 'gemini-2.5-flash'
        self.ai = AIService(self.client, self.model_name)
        self.chatbot = ChatbotService(self.client, self.model_name)

# ==========================================
# KHỐI KIỂM THỬ CHẠY THỬ NGẦM (TEST CASES)
# ==========================================
if __name__ == "__main__":
    print("\n" + "="*70)
    print(">>> KÍCH HOẠT KIỂM THỬ MODULE M2 TỔNG LỰC THÀNH CÔNG")
    print("="*70)
    
    # Khởi tạo dịch vụ
    service = GeminiClientService()
    
    # Kịch bản 1: Kiểm thử bóc tách bộ 3 nhãn AI Tags (Bao gồm trường hợp biên mâu thuẫn + phủ định)
    cau_hoi_test = "Thèm ăn sushi Nhật sang chảnh xịn xò tí mà giá sinh viên thôi nha, né mấy quán vỉa hè ra"
    print(f"\n[Test Case 1] Người dùng nhập: '{cau_hoi_test}'")
    tags_output = service.ai.extract_intent_tags(cau_hoi_test)
    print("Kết quả JSON bóc tách đủ 3 loại tags:")
    print(json.dumps(tags_output, indent=4, ensure_ascii=False))
    
    print("-" * 70)
    
    # Kịch bản 2: Kiểm thử luồng hội thoại của Chatbot (Có kèm giữ lịch sử trò chuyện cũ)
    lich_su_chat = [
        {"role": "user", "text": "Hi bạn, mình đang muốn tìm chỗ ăn tối"},
        {"role": "model", "text": "Chào bạn! Mình sẵn sàng hỗ trợ đây. Bạn muốn ăn món gì và đi cùng ai để mình gợi ý tốt nhất nhé?"}
    ]
    tin_nhan_moi = "Mình đi ăn với gia đình, muốn ăn lẩu ấm cúng xíu"
    print(f"[Test Case 2] Người dùng chat tiếp: '{tin_nhan_moi}'")
    chatbot_output = service.chatbot.generate_chatbot_response(tin_nhan_moi, history=lich_su_chat)
    print("Kết quả Chatbot phản hồi:")
    print(json.dumps(chatbot_output, indent=4, ensure_ascii=False))
    print("="*70 + "\n")