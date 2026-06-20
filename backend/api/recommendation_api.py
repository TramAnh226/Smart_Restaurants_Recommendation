from fastapi import APIRouter
from services.recommendation_service import RecommendationService
from auth.dependencies import verify_user
from fastapi import Depends

router = APIRouter(
    prefix="/recommendation",
    tags=["Recommendation"]
)

recommendation_service=RecommendationService()


@router.post("/")
async def recommend(
    data: dict,
    #user=Depends(verify_user)
):

    return await recommendation_service.get_recommendation(
        text=data.get("query", ""),
        budget=data.get("budget"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude")
    )