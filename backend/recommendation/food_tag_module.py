import re
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOOD_CONFIG_PATH = os.path.join(BASE_DIR, 'food_tag_config.json')

def load_food_tags_config(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading food tag config: {e}")
        return {}

FOOD_CONFIG = load_food_tags_config(FOOD_CONFIG_PATH)

# Build a sorted list of (keyword, tag) ordered by length of keyword descending
FOOD_KEYWORDS_LIST = []
for tag, keywords in FOOD_CONFIG.items():
    for kw in keywords:
        FOOD_KEYWORDS_LIST.append((kw.lower(), tag))

# Sort by length descending to prioritize multi-word matches
FOOD_KEYWORDS_LIST.sort(key=lambda x: len(x[0]), reverse=True)

FALLBACK_MAP = {
    "pho_ga": ["pho", "ga"],
    "pho_bo": ["pho", "bo"],
    "bun_bo_hue": ["bun", "bo"],
    "lau_thai": ["lau"],
    "lau_bo": ["lau", "bo"],
    "ga_ran": ["ga"],
    "ga_nuong": ["ga"]
}

def expand_food_tags(tags: list) -> list:
    expanded = set(tags)
    for tag in tags:
        if tag in FALLBACK_MAP:
            expanded.update(FALLBACK_MAP[tag])
    return list(expanded)


def extract_food_tags(name: str):
    if not name:
        return []
        
    name = name.lower()
    tags = []

    # Mặt nạ hoá các từ khoá đã được khớp để tránh trùng lặp
    temp_name = name
    for keyword, tag in FOOD_KEYWORDS_LIST:
        # Sử dụng ranh giới từ \b để tránh khớp nhầm phụ chuỗi
        pattern = r'\b' + re.escape(keyword) + r'\b'
        match = re.search(pattern, temp_name)
        if match:
            tags.append(tag)
            # Thay thế phần khớp bằng khoảng trắng để bảo toàn độ dài và ranh giới từ
            start, end = match.span()
            temp_name = temp_name[:start] + " " * (end - start) + temp_name[end:]

    return list(set(tags))