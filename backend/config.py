from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # ======================
    # Backend
    # ======================

    HOST:str="0.0.0.0"

    PORT:int=8000


    # ======================
    # Supabase
    # ======================

    SUPABASE_URL:str

    SUPABASE_KEY:str


    # ======================
    # AI
    # ======================

    GEMINI_API_KEY:str

    AI_MODEL:str="gemini-2.5-flash"

    TEMPERATURE:float=0.7

    MAX_OUTPUT_TOKENS:int=1000


    # ======================
    # Weather
    # ======================

    OPENWEATHER_API_KEY:str


    # ======================
    # Location
    # ======================

    OSM_BASE_URL:str=(
        "https://nominatim.openstreetmap.org"
    )


    # ======================
    # Recommendation
    # ======================

    TOP_K:int=5

    DEFAULT_SCORE:float=5.0

    MAX_DISTANCE_KM:int=20


    # ======================
    # Frontend
    # ======================

    FRONTEND_URL:str=(
        "http://localhost:5173"
    )


    class Config:

        env_file=".env"

        case_sensitive=True


settings=Settings()