from recommendation.ranking_module import top_k

def test_top_k():

    data = [

        {"score":5},
        {"score":9},
        {"score":2}

    ]

    result = top_k(
        data,
        k=2
    )

    assert result[0]["score"] == 9