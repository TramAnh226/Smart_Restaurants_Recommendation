from fastapi import APIRouter
from services.weather_service import WeatherService

router=APIRouter(
    prefix="/weather",
    tags=["Weather"]
)

weather_service=WeatherService()


@router.get("/")
async def weather(
    lat:float,
    lon:float
):

    return await weather_service.get_weather(
        lat,
        lon
    )