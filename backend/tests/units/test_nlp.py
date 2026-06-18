import pytest
from recommendation.nlp_module import extract_features, extract_features_async, preprocess

def test_preprocess_number_separators():
    # Test that thousands separators (dot or comma followed by 000) are removed
    assert preprocess("50.000đ") == "50000đ"
    assert preprocess("100,000 đồng") == "100000 đồng"
    
    # Test that decimal points (ratings, quantities) are spaced out according to the tokenization design
    assert preprocess("4.5 sao") == "4 . 5 sao"
    assert preprocess("3,5 sao") == "3 , 5 sao"
    assert preprocess("1.5 bát") == "1 . 5 bát"

def test_taste_detection_and_negation():
    # Normal matching
    res = extract_features("Món này cay quá")
    assert "spicy" in res["taste_tags"]
    
    # Negation matching
    res_neg = extract_features("Món này không cay đâu")
    assert "spicy" not in res_neg["taste_tags"]
    
    res_neg2 = extract_features("chả cay tí nào")
    assert "spicy" not in res_neg2["taste_tags"]

def test_cuisine_type_matching():
    # Vietnamese
    res_vn = extract_features("phở bò và gỏi cuốn")
    assert "vietnamese" in res_vn["cuisine_type"]
    
    # Chinese (New tag)
    res_cn = extract_features("Thèm ăn dimsum hoặc vịt quay Bắc Kinh")
    assert "chinese" in res_cn["cuisine_type"]
    
    # Western & Italian (New tags)
    res_it = extract_features("Một phần steak sốt tiêu và pizza hải sản kiểu Ý")
    assert "western" in res_it["cuisine_type"]
    assert "italian" in res_it["cuisine_type"]

def test_style_and_environment_matching():
    res = extract_features("Quán cafe sân vườn mát mẻ máy lạnh phà phà")
    assert "cafe" in res["style_tags"]
    assert "garden" in res["environment_tags"]
    assert "air_conditioned" in res["environment_tags"]

@pytest.mark.asyncio
async def test_extract_features_async():
    res = await extract_features_async("Nước lẩu thái chua cay chuẩn vị")
    assert "thai" in res["cuisine_type"]
    assert "spicy" in res["taste_tags"]
    assert "sour" in res["taste_tags"]

def test_food_tag_extraction():
    from recommendation.food_tag_module import extract_food_tags
    
    # Basic word boundary matching
    assert "pho" in extract_food_tags("Phở bò Hà Nội")
    assert "bo" in extract_food_tags("Phở bò Hà Nội")
    
    # Avoid substring matching (e.g. "pho" in "Phong")
    assert "pho" not in extract_food_tags("Nhà hàng Phong Cảnh")
    
    # Check that extract_features returns food_tags
    res = extract_features("Tôi muốn ăn cơm tấm và uống trà sữa")
    assert "com_tam" in res["food_tags"]
    assert "milk_tea" in res["food_tags"]