import httpx

from config import settings


class LocationService:

    async def reverse_geocode(
        self,
        lat: float,
        lon: float
    ):

        url = f"{settings.OSM_BASE_URL}/reverse"

        params = {
            "lat": lat,
            "lon": lon,
            "format": "jsonv2"
        }

        async with httpx.AsyncClient() as client:

            response = await client.get(
                url,
                params=params
            )

            response.raise_for_status()

        return response.json()