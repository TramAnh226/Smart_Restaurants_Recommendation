from auth.supabase_client import supabase


class AuthService:

    async def sign_up(
        self,
        email: str,
        password: str
    ):

        return supabase.auth.sign_up(
            {
                "email": email,
                "password": password
            }
        )

    async def sign_in(
        self,
        email: str,
        password: str
    ):

        return supabase.auth.sign_in_with_password(
            {
                "email": email,
                "password": password
            }
        )

    async def sign_out(self):

        return supabase.auth.sign_out()