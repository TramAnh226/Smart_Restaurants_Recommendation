# Cấu Trúc Database Supabase

Tài liệu này mô tả chi tiết cấu trúc database của hệ thống gợi ý món ăn, bao gồm **5 bảng chính** được lưu trữ trên Supabase (PostgreSQL).

---

## 0. Tổng Quan

### 0.1. Thư viện cần thiết

> [!NOTE]
> Phiên bản Python đã chạy thử truy vấn: 3.13.11

Để gửi truy vấn tới Supabase, cần phải tải thư viện `supabase`.

```bash
pip install supabase python-dotenv
```

### 0.2. Gửi truy vấn tới Supabase

Để gửi truy vấn tới Supabase, cần 2 thứ: `SUPABASE_URL` và `SUPABASE_ANON_KEY`.

```python
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

### 0.3. Lưu ý về kiểu dữ liệu `json` và `jsonb`

Trong hệ thống này, nhiều cột sử dụng kiểu **`jsonb`** thay vì `json` thông thường. Đây là lựa chọn có chủ đích:

| Đặc tính | `json` | `jsonb` (JSON Binary) |
| :--- | :--- | :--- |
| **Lưu trữ** | Văn bản thuần túy, giữ nguyên chuỗi gốc | Nhị phân tối ưu hóa, sắp xếp lại key |
| **Tốc độ đọc/lọc** | Chậm hơn (phải parse lại mỗi lần) | Nhanh hơn vượt trội |
| **Tốc độ ghi** | Nhanh hơn | Chậm hơn một chút |
| **Index (GIN)** | Không hỗ trợ toàn bộ document | Hỗ trợ đầy đủ GIN Index |

> [!NOTE]
> **`jsonb` được khuyến nghị** khi cần lọc, tìm kiếm sâu vào bên trong JSON (ví dụ: lọc món có `taste` chứa `"vegetarian"`). Tất cả các cột dạng mảng/đối tượng trong hệ thống này đều dùng `jsonb`.

---

## 1. Sơ Đồ Quan Hệ (ERD)

```
┌──────────────────┐         ┌──────────────────────────┐
│      users       │         │         favorites        │
│──────────────────│         │──────────────────────────│
│ id (PK)          │◄────────│ user_id (FK → users.id)  │
│ email            │         │ menu_id (FK → menu.id)   │
│ password         │         │ restaurant_id (FK)       │
│ name             │         │ note                     │
│ taste_preferences│         │ created_at               │
│ allergy_prefs    │         └──────────────────────────┘
│ preferred_...    │
│ created_at       │         ┌──────────────────────────┐
│ updated_at       │         │   recommendation_history │
└──────────────────┘         │──────────────────────────│
                             │ user_id (FK → users.id)  │
┌──────────────────┐◄────────│ menu_id (FK → menu.id)   │
│    restaurant    │◄────────│ restaurant_id (FK)       │
│──────────────────│         │ context (jsonb)          │
│ id (PK)          │         │ score                    │
│ name             │         │ reason                   │
│ address          │         │ action                   │
│ rating           │         │ created_at               │
│ review_count     │         └──────────────────────────┘
│ opening_hours    │
│ embedding_vector │◄────────────────────┐
└──────────────────┘                     │
         │                               │
         │ 1:N                           │
         ▼                               │
┌──────────────────┐                     │
│       menu       │─────────────────────┘
│──────────────────│
│ id (PK)          │
│ restaurant_id(FK)│
│ name             │
│ price            │
│ preview          │
│ taste (jsonb)    │
│ country_code     │
│ style            │
│ weather_code     │
└──────────────────┘
```

---

## 2. Chi Tiết Các Bảng

### 2.1. Bảng `restaurant`

Lưu trữ thông tin của các quán ăn/nhà hàng được crawl từ ShopeeFood.

**Số dòng hiện tại:** ~1,373 nhà hàng

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Khóa | Mô Tả | Ví Dụ |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `uuid` | ✗ | `gen_random_uuid()` | **PK** | ID định danh duy nhất | `"4288a4ce-..."` |
| `name` | `varchar` | ✓ | — | | Tên nhà hàng | `"Bò Né D10"` |
| `address` | `varchar` | ✓ | — | | Địa chỉ đầy đủ | `"48 Dương Khuê, Tân Phú"` |
| `rating` | `real` | ✓ | — | | Điểm đánh giá (0.0 – 5.0) | `4.5` |
| `review_count` | `bigint` | ✓ | — | | Tổng số lượt đánh giá | `128` |
| `opening_hours` | `jsonb` | ✓ | — | | Giờ mở cửa theo từng thứ | *(xem bên dưới)* |
| `embedding_vector` | `jsonb` | ✓ | — | | Vector nhúng phục vụ gợi ý AI | `[0.12, -0.34, ...]` |

**Cấu trúc `opening_hours`:**
```json
{
  "monday":    "08:00-22:00",
  "tuesday":   "08:00-22:00",
  "wednesday": "08:00-22:00",
  "thursday":  "08:00-22:00",
  "friday":    "08:00-22:00",
  "saturday":  "08:00-23:00",
  "sunday":    "08:00-23:00"
}
```
> Giá trị có thể là `Null` cho từng thứ nếu quán đóng cửa hoặc chưa có thông tin.

---

### 2.2. Bảng `menu`

Lưu trữ danh sách các món ăn trong thực đơn của mỗi nhà hàng, kèm thông tin phân loại tự động.

**Số dòng hiện tại:** ~17,314 món ăn

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Khóa | Mô Tả | Ví Dụ |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `uuid` | ✗ | `gen_random_uuid()` | **PK** | ID định danh duy nhất | `"ca3bc571-..."` |
| `restaurant_id` | `uuid` | ✓ | `gen_random_uuid()` | **FK** | Liên kết tới `restaurant.id` | `"4288a4ce-..."` |
| `name` | `varchar` | ✓ | — | | Tên món ăn | `"Bò né thập cẩm"` |
| `price` | `bigint` | ✓ | — | | Giá bán (VNĐ) | `45000` |
| `preview` | `text` | ✓ | — | | URL ảnh xem trước | `"https://..."` |
| `taste` | `jsonb` | ✓ | — | | Mảng vị của món | `["savory", "spicy"]` |
| `country_code` | `jsonb` | ✓ | — | | Xuất xứ/thể loại ẩm thực | `"vietnamese"` |
| `style` | `jsonb` | ✓ | — | | Phong cách phục vụ | `"casual"` |
| `weather_code` | `jsonb` | ✓ | — | | Phù hợp thời tiết | `"all"` |

**Các giá trị hợp lệ:**

| Cột | Các giá trị có thể |
| :--- | :--- |
| `taste` | `"sweet"`, `"spicy"`, `"sour"`, `"savory"`, `"vegetarian"` |
| `country_code` | `"vietnamese"`, `"japanese"`, `"korean"`, `"chinese"`, `"italian"`, `"western"`, `"thai"`, `"indian"` |
| `style` | `"hotpot"`, `"streetfood"`, `"fast-food"`, `"cafe"`, `"snack"`, `"casual"` |
| `weather_code` | `"hot"`, `"rain"`, `"all"` |

---

### 2.3. Bảng `users`

Lưu trữ thông tin tài khoản người dùng và các sở thích cá nhân phục vụ gợi ý.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Khóa | Mô Tả | Ví Dụ |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `uuid` | ✗ | `gen_random_uuid()` | **PK** | ID định danh duy nhất | `"a1b2c3d4-..."` |
| `email` | `varchar(255)` | ✗ | — | | Địa chỉ email (unique) | `"user@gmail.com"` |
| `password` | `text` | ✗ | — | | Mật khẩu (đã hash) | `"$2b$10$..."` |
| `name` | `varchar(255)` | ✓ | — | | Tên hiển thị | `"Nguyễn Văn A"` |
| `taste_preferences` | `jsonb` | ✓ | — | | Sở thích vị giác | `["savory", "spicy"]` |
| `allergy_preferences` | `jsonb` | ✓ | — | | Dị ứng thực phẩm | `["seafood"]` |
| `preferred_countries` | `jsonb` | ✓ | — | | Ẩm thực yêu thích | `["vietnamese", "japanese"]` |
| `preferred_styles` | `jsonb` | ✓ | — | | Phong cách ưa thích | `["casual", "streetfood"]` |
| `created_at` | `timestamptz` | ✗ | `now()` | | Thời điểm tạo tài khoản | `"2025-01-15T08:00:00Z"` |
| `updated_at` | `timestamptz` | ✗ | `now()` | | Thời điểm cập nhật cuối | `"2025-05-01T12:00:00Z"` |

---

### 2.4. Bảng `favorites`

Lưu trữ danh sách món ăn / nhà hàng yêu thích của từng người dùng.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Khóa | Mô Tả | Ví Dụ |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `uuid` | ✗ | `gen_random_uuid()` | **PK** | ID định danh duy nhất | `"f1e2d3c4-..."` |
| `user_id` | `uuid` | ✗ | — | **FK** | Liên kết tới `users.id` | `"a1b2c3d4-..."` |
| `menu_id` | `uuid` | ✓ | — | **FK** | Liên kết tới `menu.id` | `"ca3bc571-..."` |
| `restaurant_id` | `uuid` | ✓ | — | **FK** | Liên kết tới `restaurant.id` | `"4288a4ce-..."` |
| `note` | `text` | ✓ | — | | Ghi chú cá nhân của user | `"Quán ngon, hay đặt"` |
| `created_at` | `timestamptz` | ✓ | `now()` | | Thời điểm thêm vào yêu thích | `"2025-05-10T09:30:00Z"` |

> [!NOTE]
> Một record `favorites` có thể lưu yêu thích theo **món ăn cụ thể** (`menu_id`) hoặc theo **nhà hàng** (`restaurant_id`). Cả hai cột đều nullable để hỗ trợ cả hai trường hợp.

---

### 2.5. Bảng `recommendation_history`

Ghi lại lịch sử các gợi ý đã được hệ thống AI đưa ra cho từng người dùng, phục vụ việc phân tích và cải thiện chất lượng gợi ý.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Khóa | Mô Tả | Ví Dụ |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| `id` | `uuid` | ✗ | `gen_random_uuid()` | **PK** | ID định danh duy nhất | `"e9f8a7b6-..."` |
| `user_id` | `uuid` | ✗ | — | **FK** | Liên kết tới `users.id` | `"a1b2c3d4-..."` |
| `menu_id` | `uuid` | ✓ | — | **FK** | Liên kết tới `menu.id` | `"ca3bc571-..."` |
| `restaurant_id` | `uuid` | ✓ | — | **FK** | Liên kết tới `restaurant.id` | `"4288a4ce-..."` |
| `context` | `jsonb` | ✓ | — | | Ngữ cảnh khi gợi ý (thời tiết, giờ...) | *(xem bên dưới)* |
| `score` | `real` | ✓ | — | | Điểm số tương đồng/gợi ý (0.0–1.0) | `0.87` |
| `reason` | `text` | ✓ | — | | Giải thích lý do gợi ý | `"Phù hợp vị cay, trời mưa"` |
| `action` | `varchar` | ✓ | — | | Hành động của user với gợi ý | `"liked"`, `"dismissed"` |
| `created_at` | `timestamptz` | ✓ | `now()` | | Thời điểm gợi ý được tạo | `"2025-05-20T12:00:00Z"` |

**Cấu trúc `context`:**
```json
{
  "weather": "rain",
  "time_of_day": "lunch",
  "location": "Quận 1",
  "budget": 50000
}
```

Cấu trúc trên do AI gợi ý và có thể thay đổi tùy theo tình hình và mọi người thống nhất với nhau như thế nào.

---

## 3. Tóm Tắt Thống Kê

| Bảng | Số Cột | Số Dòng (ước tính) | Mục Đích |
| :--- | :---: | :---: | :--- |
| `restaurant` | 7 | ~1,373 | Thông tin nhà hàng |
| `menu` | 9 | ~17,314 | Thực đơn & phân loại món ăn |
| `users` | 10 | — | Tài khoản & sở thích người dùng |
| `favorites` | 6 | — | Danh sách yêu thích |
| `recommendation_history` | 9 | — | Lịch sử gợi ý của AI |