from typing import Dict, List
import re
import json
import os
import google.generativeai as genai
from backend.config import Config


# ===== LOAD FILE =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TAG_CONFIG_PATH = os.path.join(BASE_DIR, 'nlp_tag_config.json')

VALID_TASTE = []
VALID_CONTEXT = []
VALID_STYLE = []
VALID_ENVIRONMENT = []
VALID_CUISINE = []
VALID_CATEGORY = []
TASTE_KEYWORDS = []
CONTEXT_KEYWORDS = []
STYLE_KEYWORDS = []
ENVIRONMENT_KEYWORDS = []
CUISINE_KEYWORDS = []
CATEGORY_KEYWORDS = []

def load_nlp_tags_config(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file {filepath}")
        return None
    except json.JSONDecodeError:
        print("Lỗi: File JSON bị sai định dạng (thiếu dấu phẩy, ngoặc...)")
        return None

config_data = load_nlp_tags_config(TAG_CONFIG_PATH)
if config_data:
    # --- Valid Tags ---
    VALID_TASTE = config_data["valid_tags"]["taste"]
    VALID_CONTEXT = config_data["valid_tags"]["context"]
    VALID_STYLE = config_data["valid_tags"]["style"]
    VALID_ENVIRONMENT = config_data["valid_tags"]["environment"]
    VALID_CUISINE = config_data["valid_tags"]["cuisine"]
    VALID_CATEGORY = config_data["valid_tags"]["category"]

    # --- Keywords ---
    TASTE_KEYWORDS = config_data["keywords"]["taste"]
    CONTEXT_KEYWORDS = config_data["keywords"]["context"]
    STYLE_KEYWORDS = config_data["keywords"]["style"]
    ENVIRONMENT_KEYWORDS = config_data["keywords"]["environment"]
    CUISINE_KEYWORDS = config_data["keywords"]["cuisine"]
    CATEGORY_KEYWORDS = config_data["keywords"]["category"]

FEATURE_CONFIG = {
    "taste_tags": (TASTE_KEYWORDS, VALID_TASTE),
    "context_tags": (CONTEXT_KEYWORDS, VALID_CONTEXT),
    "style_tags": (STYLE_KEYWORDS, VALID_STYLE),
    "environment_tags": (ENVIRONMENT_KEYWORDS, VALID_ENVIRONMENT),
    "cuisine_type": (CUISINE_KEYWORDS, VALID_CUISINE),
    "category": (CATEGORY_KEYWORDS, VALID_CATEGORY)
}

VALID_MAPPING = {
    "taste_tags": VALID_TASTE,
    "context_tags": VALID_CONTEXT,
    "style_tags": VALID_STYLE,
    "environment_tags": VALID_ENVIRONMENT,
    "cuisine_type": VALID_CUISINE,
    "category": VALID_CATEGORY
}



genai.configure(api_key=Config.GEMINI_API_KEY)

def extract_features_with_gemini(text: str) -> dict:
    """
    Sử dụng Gemini 2.5 Flash để phân tích văn bản và trích xuất tag dưới dạng JSON.
    """
    if not text or not isinstance(text, str):
        return {}

    # Model với cấu hình ép kiểu trả về JSON
    # Khai báo response_mime_type giúp Gemini biết nó BẮT BUỘC phải sinh ra JSON hợp lệ
    model = genai.GenerativeModel(
        model_name=Config.AI_MODEL,
        generation_config={"response_mime_type": "application/json"}
    )

    # Prompt
    prompt = f"""
    Bạn là một chuyên gia phân tích dữ liệu đánh giá ẩm thực (Food Review NLP).
    Nhiệm vụ của bạn là đọc đoạn văn bản đầu vào và trích xuất các đặc điểm món ăn/nhà hàng.
    
    YÊU CẦU BẮT BUỘC:
    1. Chỉ được phép xuất ra định dạng JSON.
    2. Tuyệt đối CHỈ SỬ DỤNG các tag nằm trong danh sách cho phép dưới đây. Nếu văn bản không có thông tin về một nhóm, hãy để mảng rỗng []. Không được tự bịa ra tag mới.
    
    DANH SÁCH TAG CHO PHÉP:
    - taste_tags: {VALID_TASTE}
    - context_tags: {VALID_CONTEXT}
    - style_tags: {VALID_STYLE}
    - environment_tags: {VALID_ENVIRONMENT}
    - cuisine_type: {VALID_CUISINE}
    - category: {VALID_CATEGORY}
    
    ĐỊNH DẠNG JSON ĐẦU RA YÊU CẦU:
    {{
        "taste_tags": [],
        "context_tags": [],
        "style_tags": [],
        "environment_tags": [],
        "cuisine_type": [],
        "category": []
    }}

    VĂN BẢN ĐẦU VÀO CẦN PHÂN TÍCH:
    "{text}"
    """

    try:
        # gọi model 
        response = model.generate_content(prompt)
        # trả về
        raw_dict = json.loads(response.text)
        
        validated_dict = {}
        
        for key, valid_list in VALID_MAPPING.items():
            # Lấy list tag mà AI trả về. Nếu AI làm rơi mất key này, mặc định là list rỗng []
            raw_tags = raw_dict.get(key, [])
            
            # Đề phòng AI lỡ trả về string (vd: "spicy") thay vì list (vd: ["spicy"])
            if not isinstance(raw_tags, list):
                raw_tags = [raw_tags] if isinstance(raw_tags, str) else []
                
            valid_set = set(valid_list)
            validated_tags = [tag for tag in raw_tags if tag in valid_set]
            
            # Lưu vào kết quả cuối cùng (đảm bảo không bị trùng lặp bằng list(set()))
            validated_dict[key] = list(set(validated_tags))
            
        return validated_dict
        
    except Exception as e:
        print(f"Lỗi khi gọi Gemini API: {e}")
        return {
            "taste_tags": [], 
            "context_tags": [], 
            "style_tags": [],
            "environment_tags": [], 
            "cuisine_type": [], 
            "category": []
        }


def extract_features_rule_based(text: str) -> dict:
    features = {}

    for feature_name, (keywords_dict, valid_list) in FEATURE_CONFIG.items():
        raw_tags = match_keywords(text, keywords_dict)
        
        # Mẹo tối ưu: Chuyển valid_list thành set để tìm kiếm tốc độ O(1)
        valid_set = set(valid_list)
        features[feature_name] = [t for t in raw_tags if t in valid_set]
    
    return features


# ===== HELPER FUNCTIONS =====
def match_keywords(text: str, keyword_dict: Dict[str, List[str]]) -> List[str]:
    results = []

    negations = [
        "không", "chưa", "chẳng", "chả", "ít",
        "không có", "không hề", "không phải",
        "ko", "kh", "khg", "khum"
    ]
    # Tạo chuỗi (?<!không )(?<!chưa )(?<!chẳng )...
    # Lưu ý: CÓ DẤU CÁCH ở cuối mỗi từ (ví dụ "không ") để bắt đúng "không cay"
    lookbehinds = "".join([f"(?<!{neg} )" for neg in negations])

    for tag, keywords in keyword_dict.items():
        escaped_kws = [re.escape(kw.lower()) for kw in keywords]
        
        # Gom tất cả keyword của 1 tag lại bằng toán tử OR (|) trong regex
        # Ví dụ tạo ra: r'\b(cay|ớt|sa tế)\b'
        # \b kw \b để tìm riêng từ
        # tránh trường hợp re trong tre hay crepe
        pattern = lookbehinds + r'\b(' + '|'.join(escaped_kws) + r')\b'
        
        # re.search chỉ cần chạy đúng 1 lần cho MỖI TAG (thay vì chạy cho từng keyword)
        if re.search(pattern, text):
            results.append(tag)
            
    return results


def preprocess(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"(?<=\d)[.,](?=\d)", "", text) # Xoá ., giữa 2 số

    text = re.sub(r"([.,!?:;])(?:\s*\1)+", r"\1", text) # ",, ," -> ","
    text = re.sub(r"([.,!?:;]+)", r" \1 ", text) # "," -> " , "

    text = re.sub(r"[^\w\s.,!?:;]|_", " ", text) # Xoá ký tự đặc biệt; giữ lại chữ, số, khoảng trắng, dấu câu
    text = " ".join(text.split()) # Xoá khoảng trắng thừa (kể cả \t, \n, \r,...)

    return text.strip()

# ===== MAIN FUNCTION =====
def extract_features(text: str) -> Dict:
    if not text:
        return {
            "taste_tags": [],
            "context_tags": [],
            "style_tags": [],
            "environment_tags": [],
            "cuisine_type": [],
            "category": []
        }
    
    text = preprocess(text)

    features = extract_features_rule_based(text)

    total_tags_found = sum(len(tags) for tags in features.values())
    # Nếu số tag Rule-based tìm được < 3 thì mới gọi gemini ai
    if(total_tags_found < 3):
        features_llm = extract_features_with_gemini(text)

        # Thêm những tag AI có, mà Rule-based không có
        for key in features.keys():
            # Chuyển list thành set để dễ gộp
            regex_tags = set(features.get(key, []))
            ai_tags = set(features_llm.get(key, []))
            
            # Phép hợp | (Union)
            merged_tags = regex_tags | ai_tags
            
            # Cập nhật lại vào features dưới dạng list
            features[key] = list(merged_tags)

    return features


# ===== TEST =====
if __name__ == "__main__":
    test_inputs = [
        "Cuối tuần rủ lũ bạn ra vỉa hè làm tí xiên bẩn chém gió là nhất.",
        "Mình đi 2 người gọi 1 bát phở bò và 1 phần gỏi cuốn, nước dùng ngọt thanh từ xương.",
        "Buffet nướng BBQ ở đây đồ hải sản tươi rói, không gian sang trọng.",
        "Quán cf này view sân thượng đỉnh chóp, giá sinh viên hạt dẻ.",
        "Nước lẩu thái chua cay chuẩn vị, tôm mực béo ngậy.",
        "Menu thuần chay, đồ ăn healthy thanh tịnh, phù hợp cho người lớn tuổi."
    ]

    with open("output.txt", "w", encoding="utf-8") as f:
        for text in test_inputs:

            f.write(f"Input: {text}\n")
            
            f.write(f"Preprocess: {preprocess(text)}\n")
            
            # Ghi Output dạng JSON
            features = extract_features(text)
            # Chuyển dictionary thành chuỗi JSON
            json_output = json.dumps(features, ensure_ascii=False, indent=4)
            f.write("Output:\n")
            f.write(json_output + "\n")
            
            f.write("-" * 40 + "\n\n")