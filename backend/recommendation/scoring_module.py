import math
from recommendation.learning_module import LearningModule


class RecommendationScorer:
    def __init__(self):
        self.base_weights = {
            "food": 0.30,
            "taste": 0.20,
            "price": 0.10,
            "distance": 0.15,
            "context": 0.10,
            "rating": 0.05,
            "weather": 0.05,
            "learning": 0.05
        }

    def default_score(self, value):
        return value if value is not None else 5.0

    # ----------------------------
    # Dynamic Weight Redistribution
    # ----------------------------
    def adjusted_weights(self, scores):
        active = {
            k: v
            for k, v in self.base_weights.items()
            if scores.get(k) is not None
        }

        total = sum(active.values())

        if total == 0:
            return self.base_weights

        return {
            k: round(v / total, 4)
            for k, v in active.items()
        }

    # ----------------------------
    # Generic Similarity
    # ----------------------------
    def similarity_score(self, user_tags, restaurant_tags):
        if not user_tags:
            return None

        user_set = set(user_tags)
        restaurant_set = set(restaurant_tags or [])

        matched = len(user_set & restaurant_set)

        return round((matched / len(user_set)) * 10, 2)

    # ----------------------------
    # Taste Score
    # ----------------------------
    def taste_score(self, user_tags, restaurant_tags):
        return self.similarity_score(
            user_tags,
            restaurant_tags
        )

    # ----------------------------
    # Context Score
    # ----------------------------
    def context_score(self, user_context, restaurant_context):
        return self.similarity_score(
            user_context,
            restaurant_context
        )

    # ----------------------------
    # Price Score
    # ----------------------------
    def price_score(self, budget, avg_price):
        if budget is None or budget <= 0:
            return None
        
        if avg_price is None:
            return None

        diff_ratio = abs(budget - avg_price) / budget
        score = 1 - diff_ratio

        return round(
            max(0, min(score * 10, 10)),
            2
        )

    # ----------------------------
    # Distance Score (Haversine)
    # ----------------------------
    def distance_score(self, user_loc, restaurant_loc):
        if not user_loc or not restaurant_loc:
            return None

        lat1, lon1 = user_loc
        lat2, lon2 = restaurant_loc

        R = 6371

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )

        c = 2 * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a)
        )

        distance = R * c

        return round(max(0, 10 - distance), 2)

    # ----------------------------
    # Rating Score
    # ----------------------------
    def rating_score(self, rating):
        if rating is None:
            return None

        return round(
            min(max(rating * 2, 0), 10),
            2
        )

    # ----------------------------
    # Weather Score
    # ----------------------------
    def weather_score(self, relevance):
        if relevance is None:
            return None

        mapping = {
            0: 5,
            1: 6,
            2: 8,
            3: 10
        }

        return mapping.get(relevance, 5)
    
    def food_score(self, query_food_tags, restaurant_food_tags):

        if not query_food_tags:
            return None

        match = len(
            set(query_food_tags)
            &
            set(restaurant_food_tags)
        )

        return round(
            match / len(query_food_tags) * 10,
            2
        )

    # ----------------------------
    # Final Score
    # ----------------------------
    def final_score(self, scores):
        weights = self.adjusted_weights(scores)

        total = sum(
            weights[feature] *
            self.default_score(scores.get(feature))
            for feature in weights
        )

        return round(total, 2)

    # ----------------------------
    # Explain Recommendation
    # ----------------------------
    def explain_recommendation(self, scores):
        reasons = []

        if (scores.get("food") or 0) >= 8:
            reasons.append("matches the food you are looking for")

        if (scores.get("taste") or 0) >= 8:
            reasons.append("matches your taste")

        price_score = scores.get("price") or 0
        if price_score >= 8:
            reasons.append("fits your budget")

        if (scores.get("distance") or 0) >= 8:
            reasons.append("is nearby")

        if (scores.get("context") or 0) >= 8:
            reasons.append("fits your current context")

        if scores.get("rating", 0) >= 8:
            reasons.append("has strong ratings")

        if (scores.get("weather") or 0) >= 8:
            reasons.append("matches current weather")

        if (scores.get("learning") or 0) >= 8:
            reasons.append("aligns with your past behavior")

        if not reasons:
            return "Balanced recommendation."

        return "Recommended because it " + ", ".join(reasons) + "."



if __name__ == "__main__":
    scorer = RecommendationScorer()
    learner = LearningModule()

    learner.update_behavior(["cafe", "study"], "favorite")
    learner.update_behavior(["cafe"], "click")
    learner.update_behavior(["spicy"], "view")

    

    scores = {


        "taste": scorer.taste_score(
            ["spicy"],
            ["spicy", "savory"]
        ),

        "price": scorer.price_score(
            100,
            80
        ),

        "distance": scorer.distance_score(
            (10.7769, 106.7009),
            (10.7800, 106.6950)
        ),

        "context": scorer.context_score(
            ["study", "casual"],
            ["study", "student_friendly"]
        ),

        "rating": scorer.rating_score(4.6),

        "weather": scorer.weather_score(2),

        "learning": learner.calculate_learning_score(
            ["cafe", "student_friendly"]
        )
    }

    print("Detailed Scores:")
    for k, v in scores.items():
        print(f"{k}: {v}")

    final = scorer.final_score(scores)

    print("\nFinal Score:", final)

    print(
        "\nExplanation:",
        scorer.explain_recommendation(scores)
    )