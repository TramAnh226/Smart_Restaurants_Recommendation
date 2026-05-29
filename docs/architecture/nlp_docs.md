# M3: NLP & Rule-based Engine

## 1. Tổng quan

**Nhiệm vụ:** Làm sạch văn bản đầu vào và trích xuất thành một bộ nhãn (tags) có cấu trúc để phục vụ cho các thuật toán đánh giá sau.

## 2. Cấu trúc file

```monospace
Smart_Restaurants_Recommendation/
└── backend/
    └── recommendation/
        ├── nlp_module.py        # Chứa logic xử lý văn bản
        └── nlp_tag_config.json  # Chứa từ điển mapping (tags & keywords)
```

## 3. Hệ thống phân loại Tag

| Nhóm Tag | Giá trị hợp lệ hiện tại |
| :--- | :--- |
| `taste_tags` | `"spicy"`, `"sweet"`, `"savory"`, `"sour"`, `"bitter"`, `"umami"`, `"creamy"`, `"fresh"`, `"light"`, `"smoky"`, `"crispy"`, `"vegetarian"` |
| `context_tags` | `"student_friendly"`, `"casual"`, `"date"`, `"group"`, `"family"`, `"study"` |
| `style_tags` | `"street_food"`, `"fine_dining"`, `"cafe"`, `"rooftop"`, `"buffet"` |
| `"environment_tags"` | `"indoor"`, `"outdoor"`, `"air_conditioned"`, `"rooftop"`, `"garden"` |
| `cuisine_type` | `"vietnamese"`, `"japanese"`, `"thai"`, `"korean"`, `"indian"` |
| `"category"` | `"noodle"`, `"rice"`, `"drink"`, `"dessert"`, `"snack"`, `"seafood"` |


## 4. Luồng hoạt động

**Hàm chính: `extract_features(str) -> Dict`**
  - Input: Chuỗi người dùng nhập vào
  - Output: Dictionary gồm các tag tìm được từ chuỗi đầu vào
    ```json
    {
        "taste_tags": ["umami", "spicy"],
        "context_tags": ["student_friendly"],
        "style_tags": [],
        "environment_tags": [],
        "cuisine_type": ["vietnamese"],
        "category": ["rice"]
    }
    ```

**Luồng hoạt động:**
- **Bước 1:** Tiền xử lý
  - Chuyển chuỗi thành lowercase
  - Đồng nhất số liệu: Xoá ,. phân cách hàng nghìn
    </br> Ví dụ: 1.000 hoặc 1,000 → 1000
  - Chuẩn hoá dấu câu (Cho các cải tiến trong tương lai?)
    </br> Ví dụ: ",, , " → " , "
  - Xoá ký tự đặc biệt
  - Xoá khoảng trắng thừa

- **Bước 2:** Phân tích chuỗi sau khi xử lý theo Rule-based
  - Quét chuỗi đã làm sạch và đối chiếu với tập từ khóa trong file `nlp_tag_config.json`
  - Gắn nhãn các tags tương ứng với các keywords trùng khớp
  - Xử lý Phủ định: Nhận diện các từ mang nghĩa phủ định ("không", "chưa", "đừng") đứng trước từ khóa để loại trừ tag đó khỏi kết quả.
    </br>Ví dụ: "không cay, không chua" → Bỏ qua
  > [!NOTE]
  > **Hạn chế:** Thuật toán Rule-based hiện tại chưa xử lý tốt các từ nối đi kèm với từ phủ định</br>
  > Ví dụ: "không cay và chua" → Bỏ qua "spicy", phát hiện "sour"

- **Bước 3:** Gemini Fallback (Điều kiện: Chạy khi Bước 2 trả về ít hơn < 3 tags)
  - Gọi API Gemini (gemini-2.5-flash) để đọc hiểu ngữ cảnh sâu hơn
  - Cập nhật kết quả trích xuất từ LLM vào kết quả của Bước 2

- **Bước 4:** Trả về Dictionary hoàn chỉnh

## 5. Unit Testing

```
Input: Cuối tuần rủ lũ bạn ra vỉa hè làm tí xiên bẩn chém gió là nhất.
Preprocess: cuối tuần rủ lũ bạn ra vỉa hè làm tí xiên bẩn chém gió là nhất .
Output NLP:
{
    "taste_tags": [],
    "context_tags": [
        "casual"
    ],
    "style_tags": [
        "street_food"
    ],
    "environment_tags": [
        "outdoor"
    ],
    "cuisine_type": [],
    "category": [
        "snack"
    ]
}
Output LLM:
{
    "taste_tags": [],
    "context_tags": [
        "group",
        "casual"
    ],
    "style_tags": [
        "street_food"
    ],
    "environment_tags": [
        "outdoor"
    ],
    "cuisine_type": [],
    "category": [
        "snack"
    ]
}
----------------------------------------

Input: Mình đi 2 người gọi 1 bát phở bò và 1 phần gỏi cuốn, nước dùng ngọt thanh từ xương.
Preprocess: mình đi 2 người gọi 1 bát phở bò và 1 phần gỏi cuốn , nước dùng ngọt thanh từ xương .
Output NLP:
{
    "taste_tags": [
        "sweet",
        "umami"
    ],
    "context_tags": [
        "date"
    ],
    "style_tags": [],
    "environment_tags": [],
    "cuisine_type": [
        "vietnamese"
    ],
    "category": [
        "noodle"
    ]
}
Output LLM:
{
    "taste_tags": [
        "savory",
        "sweet"
    ],
    "context_tags": [
        "date"
    ],
    "style_tags": [
        "street_food"
    ],
    "environment_tags": [],
    "cuisine_type": [
        "vietnamese"
    ],
    "category": [
        "noodle",
        "snack"
    ]
}
----------------------------------------

Input: Buffet nướng BBQ ở đây đồ hải sản tươi rói, không gian sang trọng.
Preprocess: buffet nướng bbq ở đây đồ hải sản tươi rói , không gian sang trọng .
Output NLP:
{
    "taste_tags": [
        "fresh"
    ],
    "context_tags": [],
    "style_tags": [
        "fine_dining",
        "buffet"
    ],
    "environment_tags": [],
    "cuisine_type": [],
    "category": [
        "seafood"
    ]
}
Output LLM:
{
    "taste_tags": [
        "fresh"
    ],
    "context_tags": [],
    "style_tags": [
        "fine_dining",
        "buffet"
    ],
    "environment_tags": [],
    "cuisine_type": [],
    "category": [
        "seafood"
    ]
}
----------------------------------------

Input: Quán cf này view sân thượng đỉnh chóp, giá sinh viên hạt dẻ.
Preprocess: quán cf này view sân thượng đỉnh chóp , giá sinh viên hạt dẻ .
Output NLP:
{
    "taste_tags": [],
    "context_tags": [
        "student_friendly"
    ],
    "style_tags": [
        "cafe",
        "rooftop"
    ],
    "environment_tags": [
        "rooftop"
    ],
    "cuisine_type": [],
    "category": [
        "drink"
    ]
}
Output LLM:
{
    "taste_tags": [],
    "context_tags": [
        "student_friendly"
    ],
    "style_tags": [
        "cafe"
    ],
    "environment_tags": [
        "rooftop"
    ],
    "cuisine_type": [],
    "category": []
}
----------------------------------------

Input: Nước lẩu thái chua cay chuẩn vị, tôm mực béo ngậy.
Preprocess: nước lẩu thái chua cay chuẩn vị , tôm mực béo ngậy .
Output NLP:
{
    "taste_tags": [
        "spicy",
        "sour",
        "creamy"
    ],
    "context_tags": [],
    "style_tags": [],
    "environment_tags": [],
    "cuisine_type": [
        "thai"
    ],
    "category": [
        "seafood"
    ]
}
Output LLM:
{
    "taste_tags": [
        "spicy",
        "creamy",
        "sour"
    ],
    "context_tags": [],
    "style_tags": [],
    "environment_tags": [],
    "cuisine_type": [
        "thai"
    ],
    "category": [
        "seafood"
    ]
}
----------------------------------------

Input: Menu thuần chay, đồ ăn healthy thanh tịnh, phù hợp cho người lớn tuổi.
Preprocess: menu thuần chay , đồ ăn healthy thanh tịnh , phù hợp cho người lớn tuổi .
Output NLP:
{
    "taste_tags": [
        "light",
        "vegetarian"
    ],
    "context_tags": [
        "family"
    ],
    "style_tags": [],
    "environment_tags": [],
    "cuisine_type": [],
    "category": []
}
Output LLM:
{
    "taste_tags": [
        "vegetarian"
    ],
    "context_tags": [
        "family"
    ],
    "style_tags": [],
    "environment_tags": [],
    "cuisine_type": [],
    "category": []
}
----------------------------------------
```