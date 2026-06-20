class LearningModule:
    def __init__(self):
        self.preferences = {}

    def update_behavior(self, tags, action="click"):
        """
        Update learned preferences from user interactions

        Weights:
        - view = 1
        - click = 2
        - favorite = 4
        """

        if not tags:
            return

        weights = {
            "view": 1,
            "click": 2,
            "favorite": 4
        }

        boost = weights.get(action, 1)

        for tag in tags:
            self.preferences[tag] = (
                self.preferences.get(tag, 0) + boost
            )

    def calculate_learning_score(self, restaurant_tags):
        """
        Calculate score based on learned user preferences
        """

        if not self.preferences:
            return 5.0

        restaurant_tags = set(restaurant_tags or [])

        matched_weight = sum(
            weight
            for tag, weight in self.preferences.items()
            if tag in restaurant_tags
        )

        total_weight = sum(self.preferences.values())

        if total_weight == 0:
            return 5.0

        score = (matched_weight / total_weight) * 10

        return round(min(max(score, 0), 10), 2)


if __name__ == "__main__":
    learner = LearningModule()

    learner.update_behavior(["cafe", "study"], "favorite")
    learner.update_behavior(["cafe"], "click")
    learner.update_behavior(["spicy"], "view")

    print("Learned Preferences:")
    print(learner.preferences)

    score = learner.calculate_learning_score(
        ["cafe", "student_friendly"]
    )

    print("\nLearning Score:", score)