"""
Ranking Module — M6
Adapted from prototype: E:\\Code\\TDTT\\backend-20260508T150736Z-3-001\\backend\\modules\\ranking_module.py

Nhiệm vụ:
- Nhận danh sách restaurants đã scored từ M5 (scoring_module)
- Sắp xếp giảm dần theo score
- Trả về Top-K results kèm reasons
- Hỗ trợ cả format prototype (cũ) và Supabase schema (mới)
"""

from typing import List, Dict
import os


def generate_reasons(res: Dict, score: float) -> List[str]:
    """
    Sinh lý do đề xuất dựa trên thuộc tính restaurant và điểm số từ M5.
    Hỗ trợ cả schema cũ (prototype) và mới (Supabase).

    Args:
        res: Dict chứa thông tin restaurant
        score: Điểm số từ scoring module (0-10)

    Returns:
        List[str] chứa các lý do đề xuất
    """
    reasons = []

    # Xác định sắc thái dựa trên score
    if score >= 8.5:
        prefix = "Ưu tiên: "
        rating_label = "Xuất sắc"
    elif score >= 7.0:
        prefix = "Gợi ý: "
        rating_label = "Rất tốt"
    else:
        prefix = "Tham khảo: "
        rating_label = "Ổn định"

    # 1. Rating
    rating = res.get("rating", 0)
    if rating >= 4.5:
        reasons.append(f"{prefix}Được đánh giá {rating_label} ({rating}/5)")
    elif rating >= 4.0:
        reasons.append(f"{prefix}Chất lượng phục vụ {rating_label}")

    # 2. Giá — hỗ trợ cả string (prototype) và int (Supabase)
    price = res.get("price", "")
    price_lowest = res.get("price_lowest", None)
    price_highest = res.get("price_highest", None)

    if price_lowest and price_highest:
        # Supabase schema — giá cụ thể (VNĐ)
        if price_lowest <= 30000:
            reasons.append(f"{prefix}Chi phí cực kỳ bình dân ({price_lowest:,}đ — {price_highest:,}đ)")
        elif price_lowest <= 80000 and score >= 7.5:
            reasons.append(f"{prefix}Mức giá tầm trung, xứng đáng với chất lượng")
        elif price_lowest > 80000 and score >= 8.5:
            reasons.append(f"{prefix}Trải nghiệm cao cấp, tương xứng với giá trị")
    elif price:
        # Prototype schema — giá dạng string
        if price == "low":
            reasons.append(f"{prefix}Chi phí cực kỳ bình dân và tiết kiệm")
        elif price == "medium" and score >= 7.5:
            reasons.append(f"{prefix}Mức giá tầm trung, rất xứng đáng với chất lượng")
        elif price == "high" and score >= 8.5:
            reasons.append(f"{prefix}Trải nghiệm cao cấp, tương xứng với giá trị")
        elif price:
            reasons.append(f"{prefix}Phân khúc giá {price}")

    # 3. Khẩu vị (Taste) — hỗ trợ cả taste (prototype) và taste_tags (Supabase)
    tastes = res.get("taste_tags", res.get("taste", []))
    if tastes:
        taste_str = ", ".join(tastes)
        if score >= 8.0:
            reasons.append(f"{prefix}Hương vị {taste_str} chuẩn gu bạn tìm kiếm")
        else:
            reasons.append(f"{prefix}Phục vụ các món mang phong vị {taste_str}")

    # 4. Không gian (Context) — hỗ trợ cả context (prototype) và context_tags (Supabase)
    contexts = res.get("context_tags", res.get("context", []))
    if contexts:
        if "luxury" in contexts:
            reasons.append(f"{prefix}Không gian sang trọng, phù hợp dịp đặc biệt")
        elif "relaxed" in contexts:
            reasons.append(f"{prefix}Không gian thư giãn, lý tưởng để họp mặt")
        elif "fast" in contexts:
            reasons.append(f"{prefix}Phục vụ nhanh chóng, phù hợp ăn nhanh")
        else:
            ctx_str = ", ".join(contexts)
            reasons.append(f"{prefix}Phong cách không gian: {ctx_str}")

    # 5. Khoảng cách (nếu có — Supabase schema)
    distance = res.get("distance", None)
    if distance is not None:
        if distance <= 1.0:
            reasons.append(f"{prefix}Rất gần bạn (chỉ {distance:.1f} km)")
        elif distance <= 3.0:
            reasons.append(f"{prefix}Khoảng cách thuận tiện ({distance:.1f} km)")

    # 6. Cuisine type — disabled: current DB only contains 'vietnamese', not useful as a reason
    # cuisine = res.get("cuisine_type", [])
    # if cuisine:
    #     cuisine_str = ", ".join(cuisine)
    #     reasons.append(f"{prefix}Ẩm thực {cuisine_str}")

    return reasons if reasons else ["Phù hợp với các tiêu chí lựa chọn của bạn"]


def top_k(scored_list: List[Dict], k: int = None) -> List[Dict]:
    """
    Sắp xếp danh sách restaurants theo score và trả về Top-K.

    Args:
        scored_list: [{"restaurant": {...}, "score": float}] (từ M5)
        k: Số lượng kết quả (default lấy từ env TOP_K hoặc 5)

    Returns:
        List[Dict] — Top K restaurants kèm reasons
        [{"name": str, "score": float, "reason": [str], "rank": int, ...}]
    """
    if not scored_list:
        return []

    # Lấy k từ env hoặc default
    if k is None:
        k = int(os.getenv("TOP_K", "5"))

    # 1. Sắp xếp giảm dần theo score
    sorted_list = sorted(
        scored_list,
        key=lambda x: x.get("score", 0),
        reverse=True
    )

    # 2. Lấy top K kết quả
    top_results = sorted_list[:k]

    # 3. Format output
    final_output = []
    for rank, item in enumerate(top_results, start=1):
        res = item.get("restaurant", {})
        score_val = item.get("score", 0)

        # Generate reasons nếu chưa có sẵn
        reason_list = item.get("reason", None)
        if reason_list is None:
            reason_list = generate_reasons(res, score_val)

        entry = {
            "name": res.get("name", "N/A"),
            "score": round(score_val, 2),
            "reason": reason_list,
            "rank": rank,
        }

        # Thêm các fields từ Supabase schema nếu có
        if res.get("id"):
            entry["id"] = res["id"]
        if res.get("rating"):
            entry["rating"] = res["rating"]
        if res.get("price_lowest"):
            entry["price_lowest"] = res["price_lowest"]
        if res.get("price_highest"):
            entry["price_highest"] = res["price_highest"]
        if res.get("distance") is not None:
            entry["distance"] = res["distance"]
        if res.get("taste_tags"):
            entry["taste_tags"] = res["taste_tags"]
        if res.get("context_tags"):
            entry["context_tags"] = res["context_tags"]
        if res.get("preview"):
            entry["image"] = res["preview"]

        final_output.append(entry)

    return final_output


def format_recommendation_output(ranked_results: List[Dict], k: int = None) -> Dict:
    """
    Format kết quả theo API Contract.

    Args:
        ranked_results: Output từ top_k()
        k: Giá trị top_k

    Returns:
        Dict theo format:
        {
            "top_k": 5,
            "restaurants": [...]
        }
    """
    if k is None:
        k = int(os.getenv("TOP_K", "5"))

    return {
        "top_k": k,
        "restaurants": ranked_results
    }


# ===== UNIT TESTS =====
if __name__ == "__main__":
    print("=" * 60)
    print("UNIT TEST — M6 Ranking Module")
    print("=" * 60)

    # ===== TEST DATA: Prototype format (từ M5 scoring_module) =====
    scored_list_prototype = [
        {
            "restaurant": {
                "name": "Quan A", "price": "low", "rating": 4.2,
                "taste": ["spicy"], "context": ["relaxed"]
            },
            "score": 9.84
        },
        {
            "restaurant": {
                "name": "Quan B", "price": "high", "rating": 3.5,
                "taste": ["spicy", "sweet"], "context": ["relaxed"]
            },
            "score": 4.50
        },
        {
            "restaurant": {
                "name": "Quan C", "price": "medium", "rating": 4.8,
                "taste": ["sweet"], "context": ["noisy"]
            },
            "score": 8.10
        },
    ]

    # ===== TEST DATA: Supabase format =====
    scored_list_supabase = [
        {
            "restaurant": {
                "id": "uuid-001", "name": "Bún bò Huế Đông Ba",
                "rating": 4.6, "price_lowest": 30000, "price_highest": 50000,
                "taste_tags": ["spicy", "savory"],
                "context_tags": ["student_friendly"],
                "cuisine_type": ["vietnamese"],
                "distance": 0.8
            },
            "score": 9.2
        },
        {
            "restaurant": {
                "id": "uuid-002", "name": "Phở Thìn Bờ Hồ",
                "rating": 4.8, "price_lowest": 45000, "price_highest": 65000,
                "taste_tags": ["savory", "umami"],
                "context_tags": ["fast"],
                "cuisine_type": ["vietnamese"],
                "distance": 2.5
            },
            "score": 8.7
        },
    ]

    # --- TEST 1: Sorting (Prototype format) ---
    print("\n[Test 1] Kiểm tra thứ tự sắp xếp (Prototype format):")
    results = top_k(scored_list_prototype, k=3)
    for r in results:
        print(f"  Hạng {r['rank']}: {r['name']} — Score: {r['score']}")

    assert results[0]["name"] == "Quan A", "FAIL: Sort sai"
    assert results[-1]["name"] == "Quan B", "FAIL: Sort sai"
    print("  => PASS ✅")

    # --- TEST 2: Top-K count ---
    print("\n[Test 2] Kiểm tra số lượng Top-K (k=2):")
    results_k2 = top_k(scored_list_prototype, k=2)
    assert len(results_k2) == 2, f"FAIL: Expected 2, got {len(results_k2)}"
    print(f"  Số lượng trả về: {len(results_k2)} => PASS ✅")

    # --- TEST 3: Reasons generated ---
    print("\n[Test 3] Kiểm tra Reasons:")
    for r in results:
        print(f"  {r['name']}: {r['reason']}")
    assert all(len(r["reason"]) > 0 for r in results), "FAIL: Missing reasons"
    print("  => PASS ✅")

    # --- TEST 4: Supabase format ---
    print("\n[Test 4] Kiểm tra Supabase format:")
    results_sb = top_k(scored_list_supabase, k=2)
    for r in results_sb:
        print(f"  Hạng {r['rank']}: {r['name']} — Score: {r['score']}")
        print(f"    ID: {r.get('id', 'N/A')}, Distance: {r.get('distance', 'N/A')} km")
        print(f"    Reasons: {r['reason']}")

    assert results_sb[0]["id"] == "uuid-001", "FAIL: Supabase ID missing"
    assert "distance" in results_sb[0], "FAIL: Distance field missing"
    print("  => PASS ✅")

    # --- TEST 5: format_recommendation_output ---
    print("\n[Test 5] Format output theo API Contract:")
    output = format_recommendation_output(results_sb, k=2)
    print(f"  top_k: {output['top_k']}")
    print(f"  restaurants count: {len(output['restaurants'])}")
    assert output["top_k"] == 2, "FAIL: top_k mismatch"
    assert len(output["restaurants"]) == 2, "FAIL: restaurants count mismatch"
    print("  => PASS ✅")

    # --- TEST 6: Empty list ---
    print("\n[Test 6] Edge case — Empty list:")
    results_empty = top_k([], k=5)
    assert results_empty == [], "FAIL: Should return empty list"
    print("  => PASS ✅")

    # --- TEST 7: k > len(scored_list) ---
    print("\n[Test 7] Edge case — k > data length:")
    results_big_k = top_k(scored_list_prototype, k=100)
    assert len(results_big_k) == 3, f"FAIL: Expected 3, got {len(results_big_k)}"
    print(f"  Requested k=100, got {len(results_big_k)} => PASS ✅")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✅")
    print("=" * 60)
