import base64
import json
from typing import Any

import httpx

from config import get_settings


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        return None

    response = httpx.get(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_anon_key,
        },
        timeout=15,
    )
    if response.status_code != 200:
        return None
    return response.json()


def decode_jwt_payload(token: str) -> dict[str, Any]:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")))
    except Exception:
        return {}
