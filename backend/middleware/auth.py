from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import Settings, get_settings
from services.supabase_auth import decode_jwt_payload, verify_supabase_token


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str
    role: str = "user"


bearer_scheme = HTTPBearer(auto_error=False)


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Use Authorization: Bearer <token>",
        )

    return token.strip()


def _is_dev_token(token: str, settings: Settings) -> bool:
    return settings.is_development and bool(settings.dev_auth_token) and token == settings.dev_auth_token


async def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    authorization = None
    if credentials:
        authorization = f"{credentials.scheme} {credentials.credentials}"

    token = _extract_bearer_token(authorization)

    if token != settings.demo_auth_token and not _is_dev_token(token, settings):
        supabase_user = verify_supabase_token(token)
        if not supabase_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        payload = decode_jwt_payload(token)
        return CurrentUser(
            id=supabase_user.get("id") or payload.get("sub"),
            email=supabase_user.get("email") or payload.get("email", "user@example.com"),
            role=payload.get("role", "user"),
        )

    return CurrentUser(
        id="demo-user",
        email="demo@example.com",
        role="admin",
    )
