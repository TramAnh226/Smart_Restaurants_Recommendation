from fastapi import APIRouter
from services.chatbot_service import ChatbotService
from backend.auth.dependencies import verify_user
from fastapi import Depends

router=APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

chatbot_service=ChatbotService()


@router.post("/")
async def chat(
    data:dict,
    user=Depends(verify_user)
):

    response=await chatbot_service.chat(
        user["id"],
        data["message"]
    )

    return response