from fastapi import APIRouter
from services.recommendation_service import RecommendationService
from backend.auth.dependencies import verify_user
from fastapi import Depends

router = APIRouter(
    prefix="/recommendation",
    tags=["Recommendation"]
)

recommendation_service=RecommendationService()


@router.post("/")
async def recommend(
    data:dict,
    user=Depends(verify_user)
):

    result=await recommendation_service.recommend(
        user_id=user["id"],
        request_data=data
    )

    return result