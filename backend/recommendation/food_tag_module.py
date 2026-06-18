import re

FOOD_KEYWORDS = {
    "phở": "pho",
    "pho": "pho",

    "bún": "bun",
    "bun": "bun",

    "lẩu": "lau",
    "lau": "lau",

    "bò": "bo",
    "gà": "ga",
    "gà": "ga",

    "pizza": "pizza",

    "sushi": "sushi",

    "trà sữa": "milk_tea",
    "milk tea": "milk_tea",

    "chè": "che",

    "cơm tấm": "com_tam",

    "gà rán": "fried_chicken",

    "hamburger": "burger",
    "burger": "burger"
}


def extract_food_tags(name: str):
    if not name:
        return []
        
    name = name.lower()
    tags = []

    for keyword, tag in FOOD_KEYWORDS.items():
        # Sử dụng ranh giới từ \b để tránh khớp nhầm phụ chuỗi (ví dụ: "pho" trong "phong")
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, name):
            tags.append(tag)

    return list(set(tags))