class RecommendationService:

    def get_recommendation(
            self,
            text,
            budget,
            latitude,
            longitude
    ):

        '''
        M3
        NLP
        '''

        extracted = {
            "taste":["spicy"],
            "context":["student_friendly"]
        }

        '''
        M4
        Database
        '''

        restaurants=[

            {
                "id":"001",
                "name":"Bún bò Huế",
                "rating":4.8
            },

            {
                "id":"002",
                "name":"Trà đào chill",
                "rating":4.6
            }
        ]

        '''
        M5
        Score
        '''

        scored=[]

        for restaurant in restaurants:

            restaurant["score"]=8.5

            scored.append(
                restaurant
            )

        '''
        M6
        Ranking
        '''

        result=sorted(

            scored,

            key=lambda x:x["score"],

            reverse=True

        )

        return result[:5]