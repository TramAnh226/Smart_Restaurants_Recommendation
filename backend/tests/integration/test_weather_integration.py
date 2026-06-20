import pytest

from services.weather_service import (
    WeatherService
)

@pytest.mark.asyncio
async def test_weather_api():

    service = WeatherService()

    weather = await service.get_weather(
        10.7769,
        106.7009
    )

    assert weather is not None