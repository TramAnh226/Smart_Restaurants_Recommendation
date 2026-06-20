from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.weather_api import router as weather_router
from api.user_api import router as user_router
from api.favorite_api import router as favorite_router
from api.history_api import router as history_router
from api.recommendation_api import router as recommendation_router
from api.chatbot_api import router as chatbot_router
from api.restaurant_api import router as restaurant_router


app = FastAPI(
    title="Smart Restaurant Recommendation System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(restaurant_router)
app.include_router(weather_router)
app.include_router(user_router)
app.include_router(favorite_router)
app.include_router(history_router)
app.include_router(recommendation_router)
app.include_router(chatbot_router)


@app.get("/")
async def root():
    return {
        "message": "API Running"
    }   