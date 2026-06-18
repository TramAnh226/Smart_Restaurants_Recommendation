import pytest
from recommendation.scoring_module import RecommendationScorer

scorer = RecommendationScorer()

def test_similarity_score():
    # Full match
    assert scorer.similarity_score(["spicy", "sweet"], ["spicy", "sweet", "sour"]) == 10.0
    # Half match
    assert scorer.similarity_score(["spicy", "sweet"], ["spicy"]) == 5.0
    # No match
    assert scorer.similarity_score(["spicy"], ["sweet"]) == 0.0
    # Empty user tags
    assert scorer.similarity_score([], ["spicy"]) is None

def test_price_score():
    # Exact match
    assert scorer.price_score(50000, 50000) == 10.0
    # Reasonable difference
    assert scorer.price_score(50000, 40000) == 8.0
    # Budget exceeded or major difference
    assert scorer.price_score(50000, 150000) == 0.0
    # Edge cases
    assert scorer.price_score(None, 50000) is None
    assert scorer.price_score(50000, None) is None

def test_distance_score():
    # Close distance
    loc1 = (10.776889, 106.700806) # District 1, HCMC
    loc2 = (10.779000, 106.702000) # Very close
    score = scorer.distance_score(loc1, loc2)
    assert score is not None
    assert score > 8.0

    # Far distance
    loc3 = (10.776889, 106.700806)
    loc4 = (21.028511, 105.804817) # Hanoi
    assert scorer.distance_score(loc3, loc4) == 0.0

    # Empty locations
    assert scorer.distance_score(None, loc2) is None

def test_rating_score():
    assert scorer.rating_score(5.0) == 10.0
    assert scorer.rating_score(4.0) == 8.0
    assert scorer.rating_score(0.0) == 0.0
    assert scorer.rating_score(None) is None

def test_weather_score():
    assert scorer.weather_score(3) == 10
    assert scorer.weather_score(0) == 5
    assert scorer.weather_score(None) is None

def test_adjusted_weights():
    # All scores present
    scores = {"taste": 8.0, "price": 5.0, "distance": 7.0, "context": 6.0, "rating": 9.0, "weather": 8.0, "learning": 5.0}
    weights = scorer.adjusted_weights(scores)
    assert sum(weights.values()) == pytest.approx(1.0)
    assert weights["taste"] == round(0.20 / 0.70, 4)

    # Some scores missing (distance and weather are None)
    scores_partial = {"taste": 8.0, "price": 5.0, "context": 6.0, "rating": 9.0, "learning": 5.0}
    weights_partial = scorer.adjusted_weights(scores_partial)
    assert sum(weights_partial.values()) == pytest.approx(1.0)
    # taste weight should be scaled up since total active base weights = 0.20 + 0.10 + 0.10 + 0.05 + 0.05 = 0.50
    assert weights_partial["taste"] == round(0.20 / 0.50, 4)

def test_final_score():
    scores = {
        "taste": 10.0,
        "price": 10.0,
        "distance": 10.0,
        "context": 10.0,
        "rating": 10.0,
        "weather": 10.0,
        "learning": 10.0
    }
    assert scorer.final_score(scores) == 10.0

def test_explain_recommendation():
    scores = {
        "taste": 9.0,
        "price": 9.0,
        "distance": 5.0,
        "context": 5.0,
        "rating": 9.0
    }
    explanation = scorer.explain_recommendation(scores)
    assert "matches your taste" in explanation
    assert "fits your budget" in explanation
    assert "has strong ratings" in explanation
    assert "is nearby" not in explanation

def test_food_score():
    # Full match
    assert scorer.food_score(["pho", "bo"], ["pho", "bo"]) == 10.0
    # Partial match
    assert scorer.food_score(["pho", "bo"], ["pho"]) == 5.0
    # No match
    assert scorer.food_score(["pho"], ["bun"]) == 0.0
    # Empty tags
    assert scorer.food_score([], ["pho"]) is None

def test_explain_recommendation_food():
    scores = {
        "food": 9.0,
        "taste": 5.0
    }
    explanation = scorer.explain_recommendation(scores)
    assert "matches the food you are looking for" in explanation
    assert "matches your taste" not in explanation