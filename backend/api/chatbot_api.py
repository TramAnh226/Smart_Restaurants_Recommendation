from fastapi import APIRouter
from services.chatbot_service import ChatbotService
from auth.dependencies import verify_user
from fastapi import Depends

router=APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

chatbot_service=ChatbotService()


@router.post("/")
async def chat(
    data:dict,
    #user=Depends(verify_user)
):

    response = await chatbot_service.chat(
        query=data.get("message", ""),
        budget=data.get("budget"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude")
    )

    return response