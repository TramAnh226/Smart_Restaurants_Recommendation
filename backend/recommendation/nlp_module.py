from typing import Dict, List
import re
import json
import os
import google.generativeai as genai
from config import settings
from recommendation.food_tag_module import extract_food_tags

# ===== LOAD FILE =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TAG_CONFIG_PATH = os.path.join(BASE_DIR, 'nlp_tag_config.json')

VALID_TASTE = []
VALID_CONTEXT = []
VALID_STYLE = []
VALID_ENVIRONMENT = []
VALID_CUISINE = []
TASTE_KEYWORDS = []
CONTEXT_KEYWORDS = []
STYLE_KEYWORDS = []
ENVIRONMENT_KEYWORDS = []
CUISINE_KEYWORDS = []

def load_nlp_tags_config(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error: File not found {filepath}")
        return None
    except json.JSONDecodeError:
        print("Error: JSON format is invalid")
        return None

config_data = load_nlp_tags_config(TAG_CONFIG_PATH)
if config_data:
    # --- Valid Tags ---
    VALID_TASTE = config_data["valid_tags"]["taste"]
    VALID_CONTEXT = config_data["valid_tags"]["context"]
    VALID_STYLE = config_data["valid_tags"]["style"]
    VALID_ENVIRONMENT = config_data["valid_tags"]["environment"]
    VALID_CUISINE = config_data["valid_tags"]["cuisine"]

    # --- Keywords ---
    TASTE_KEYWORDS = config_data["keywords"]["taste"]
    CONTEXT_KEYWORDS = config_data["keywords"]["context"]
    STYLE_KEYWORDS = config_data["keywords"]["style"]
    ENVIRONMENT_KEYWORDS = config_data["keywords"]["environment"]
    CUISINE_KEYWORDS = config_data["keywords"]["cuisine"]

FEATURE_CONFIG = {
    "taste_tags": (TASTE_KEYWORDS, VALID_TASTE),
    "context_tags": (CONTEXT_KEYWORDS, VALID_CONTEXT),
    "style_tags": (STYLE_KEYWORDS, VALID_STYLE),
    "environment_tags": (ENVIRONMENT_KEYWORDS, VALID_ENVIRONMENT),
    "cuisine_type": (CUISINE_KEYWORDS, VALID_CUISINE)
}

VALID_MAPPING = {
    "taste_tags": VALID_TASTE,
    "context_tags": VALID_CONTEXT,
    "style_tags": VALID_STYLE,
    "environment_tags": VALID_ENVIRONMENT,
    "cuisine_type": VALID_CUISINE
}

# ===== REGEX PRE-COMPILATION =====
COMPILED_TAG_PATTERNS = {}

def init_nlp_module():
    """
    Biên dịch trước các biểu thức chính quy (Regex) khi khởi động module để tối ưu hiệu năng.
    Đồng thời sắp xếp các từ khóa theo chiều dài giảm dần để tránh lỗi khớp sớm (eager matching).
    Sử dụng \\b trong lookbehind để đảm bảo chỉ khớp các từ phủ định đứng độc lập.
    """
    global COMPILED_TAG_PATTERNS
    
    # Danh sách các từ phủ định trong tiếng Việt
    negations = [
        "không", "chưa", "chẳng", "chả", "ít",
        "không có", "không hề", "không phải",
        "ko", "kh", "khg", "khum"
    ]
    # (?<!\bkhông )(?<!\bchưa )...
    lookbehinds = "".join([f"(?<!\\b{neg} )" for neg in negations])

    for feature_name, (keywords_dict, _) in FEATURE_CONFIG.items():
        COMPILED_TAG_PATTERNS[feature_name] = {}
        for tag, keywords in keywords_dict.items():
            if not keywords:
                continue
            # Sắp xếp từ khóa dài hơn lên trước để tránh việc khớp phụ chuỗi ngắn hơn trước
            sorted_keywords = sorted(keywords, key=len, reverse=True)
            escaped_kws = [re.escape(kw.lower()) for kw in sorted_keywords]
            
            # Pattern tìm kiếm với phủ định phía trước và kiểm tra ranh giới từ (\b) hai đầu
            pattern_str = lookbehinds + r'\b(' + '|'.join(escaped_kws) + r')\b'
            COMPILED_TAG_PATTERNS[feature_name][tag] = re.compile(pattern_str)

# Khởi tạo Regex compile sẵn
if config_data:
    init_nlp_module()

# Cấu hình Gemini API nếu có Key
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


# ===== GEMINI EXTRACTION FUNCTIONS =====

def extract_features_with_gemini(text: str) -> dict:
    """
    Sử dụng Gemini để phân tích văn bản và trích xuất tag dưới dạng JSON (Phiên bản đồng bộ).
    """
    if not text or not isinstance(text, str) or not settings.GEMINI_API_KEY:
        return {key: [] for key in VALID_MAPPING.keys()}

    model = genai.GenerativeModel(
        model_name=settings.AI_MODEL,
        generation_config={
            "response_mime_type": "application/json"
        }
    )

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
    
    ĐỊNH DẠNG JSON ĐẦU RA YÊU CẦU:
    {{
        "taste_tags": [],
        "context_tags": [],
        "style_tags": [],
        "environment_tags": [],
        "cuisine_type": []
    }}

    VĂN BẢN ĐẦU VÀO CẦN PHÂN TÍCH:
    "{text}"
    """

    try:
        response = model.generate_content(prompt)
        raw_dict = json.loads(response.text)
        
        validated_dict = {}
        for key, valid_list in VALID_MAPPING.items():
            raw_tags = raw_dict.get(key, [])
            if not isinstance(raw_tags, list):
                raw_tags = [raw_tags] if isinstance(raw_tags, str) else []
                
            valid_set = set(valid_list)
            validated_tags = [tag for tag in raw_tags if tag in valid_set]
            validated_dict[key] = list(set(validated_tags))
            
        return validated_dict
        
    except Exception as e:
        print(f"Error calling Gemini API (Sync): {e}")
        return {key: [] for key in VALID_MAPPING.keys()}


async def extract_features_with_gemini_async(text: str) -> dict:
    """
    Sử dụng Gemini một cách bất đồng bộ để tránh chặn (block) Event Loop của FastAPI.
    """
    if not text or not isinstance(text, str) or not settings.GEMINI_API_KEY:
        return {key: [] for key in VALID_MAPPING.keys()}

    model = genai.GenerativeModel(
        model_name=settings.AI_MODEL,
        generation_config={
            "response_mime_type": "application/json"
        }
    )

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
    
    ĐỊNH DẠNG JSON ĐẦU RA YÊU CẦU:
    {{
        "taste_tags": [],
        "context_tags": [],
        "style_tags": [],
        "environment_tags": [],
        "cuisine_type": []
    }}

    VĂN BẢN ĐẦU VÀO CẦN PHÂN TÍCH:
    "{text}"
    """

    try:
        import asyncio
        response = await asyncio.to_thread(model.generate_content, prompt)
        raw_dict = json.loads(response.text)
        
        validated_dict = {}
        for key, valid_list in VALID_MAPPING.items():
            raw_tags = raw_dict.get(key, [])
            if not isinstance(raw_tags, list):
                raw_tags = [raw_tags] if isinstance(raw_tags, str) else []
                
            valid_set = set(valid_list)
            validated_tags = [tag for tag in raw_tags if tag in valid_set]
            validated_dict[key] = list(set(validated_tags))
            
        return validated_dict
        
    except Exception as e:
        print(f"Error calling Gemini API (Async): {e}")
        return {key: [] for key in VALID_MAPPING.keys()}


# ===== RULE-BASED EXTRACTION =====

def extract_features_rule_based(text: str) -> dict:
    """
    Trích xuất các đặc điểm dựa trên quy tắc (Rule-based) bằng Regex đã được biên dịch sẵn.
    """
    features = {}

    for feature_name, (_, valid_list) in FEATURE_CONFIG.items():
        valid_set = set(valid_list)
        matched_tags = []
        
        tag_patterns = COMPILED_TAG_PATTERNS.get(feature_name, {})
        for tag, pattern in tag_patterns.items():
            if tag in valid_set and pattern.search(text):
                matched_tags.append(tag)
                
        features[feature_name] = matched_tags
    
    return features


def preprocess(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = text.lower()
    
    # Chỉ xóa dấu chấm/phẩy khi nó đóng vai trò phân cách hàng nghìn (ví dụ: 50.000 -> 50000, 10,000 -> 10000)
    # Tránh làm hỏng số thập phân như rating 4.5, 3,5 hoặc số lượng 1.5 bát
    text = re.sub(r"(?<=\d)[.,](?=000(?!\d))", "", text)

    text = re.sub(r"([.,!?:;])(?:\s*\1)+", r"\1", text) # ",, ," -> ","
    text = re.sub(r"([.,!?:;]+)", r" \1 ", text) # "," -> " , "

    text = re.sub(r"[^\w\s.,!?:;]|_", " ", text) # Xoá ký tự đặc biệt; giữ lại chữ, số, khoảng trắng, dấu câu
    text = " ".join(text.split()) # Xoá khoảng trắng thừa (kể cả \t, \n, \r,...)

    return text.strip()


# ===== MAIN FUNCTIONS =====

def extract_features(text: str) -> Dict:
    """
    Trích xuất đặc điểm (phiên bản đồng bộ - cho test script/cron job).
    """
    if not text:
        res = {key: [] for key in VALID_MAPPING.keys()}
        res["food_tags"] = []
        return res
    
    text = preprocess(text)
    features = extract_features_rule_based(text)

    # Nếu rule-based tìm được ít hơn 3 tag và cấu hình API Key đầy đủ thì gọi Gemini bổ trợ
    total_tags_found = sum(len(tags) for tags in features.values())
    if total_tags_found < 3 and settings.GEMINI_API_KEY:
        features_llm = extract_features_with_gemini(text)

        # Trộn các tag tìm được từ LLM vào kết quả
        for key in features.keys():
            regex_tags = set(features.get(key, []))
            ai_tags = set(features_llm.get(key, []))
            merged_tags = regex_tags | ai_tags
            features[key] = list(merged_tags)

    # Chiết xuất food_tags động từ văn bản gốc
    features["food_tags"] = extract_food_tags(text)

    return features


async def extract_features_async(text: str) -> Dict:
    """
    Trích xuất đặc điểm (phiên bản bất đồng bộ - khuyến nghị dùng cho FastAPI).
    """
    if not text:
        res = {key: [] for key in VALID_MAPPING.keys()}
        res["food_tags"] = []
        return res
    
    text = preprocess(text)
    features = extract_features_rule_based(text)

    total_tags_found = sum(len(tags) for tags in features.values())
    if total_tags_found < 3 and settings.GEMINI_API_KEY:
        features_llm = await extract_features_with_gemini_async(text)

        for key in features.keys():
            regex_tags = set(features.get(key, []))
            ai_tags = set(features_llm.get(key, []))
            merged_tags = regex_tags | ai_tags
            features[key] = list(merged_tags)

    # Chiết xuất food_tags động từ văn bản gốc
    features["food_tags"] = extract_food_tags(text)

    return features


# ===== TEST =====
if __name__ == "__main__":
    test_inputs = [
        "Cuối tuần rủ lũ bạn ra vỉa hè làm tí xiên bẩn chém gió là nhất.",
        "Mình đi 2 người gọi 1 bát phở bò và 1 phần gỏi cuốn, nước dùng ngọt thanh từ xương.",
        "Buffet nướng BBQ ở đây đồ hải sản tươi rói, không gian sang trọng.",
        "Quán cf này view sân thượng đỉnh chóp, giá sinh viên hạt dẻ.",
        "Nước lẩu thái chua cay chuẩn vị, tôm mực béo ngậy.",
        "Menu thuần chay, đồ ăn healthy thanh tịnh, phù hợp cho người lớn tuổi.",
        "Hàng không cay nhé, vì mình không thích ăn ớt.", # Test trường hợp "hàng không" và "không thích"
        "Tôi muốn tìm quán đồ Hoa ngon lành ở quận 5.", # Test từ khóa "chinese"
        "Ăn steak hay pizza kiểu Ý ngon sang chảnh ở đâu nhỉ?" # Test từ khóa "western" và "italian"
    ]

    with open("output.txt", "w", encoding="utf-8") as f:
        for text in test_inputs:
            f.write(f"Input: {text}\n")
            f.write(f"Preprocess: {preprocess(text)}\n")
            
            features = extract_features(text)
            json_output = json.dumps(features, ensure_ascii=False, indent=4)
            f.write("Output:\n")
            f.write(json_output + "\n")
            f.write("-" * 40 + "\n\n")