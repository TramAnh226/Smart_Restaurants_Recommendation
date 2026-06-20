from fastapi import Header
from fastapi import HTTPException

from supabase import create_client

from config import settings


supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)


async def verify_user(
    authorization: str = Header(None)
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Missing token"
        )

    if not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

    try:

        user = supabase.auth.get_user(
            token
        )

        return {
            "id": user.user.id,
            "email": user.user.email
        }

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )