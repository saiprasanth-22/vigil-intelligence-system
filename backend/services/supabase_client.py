from typing import Any
from urllib.parse import quote

import httpx

from config import get_settings


class SupabaseClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.supabase_url and self.settings.supabase_service_role_key)

    def insert(self, table: str, record: dict[str, Any]) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        response = httpx.post(
            self._table_url(table),
            headers={**self._headers(), "Prefer": "return=representation"},
            json=record,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

    def list(
        self,
        table: str,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        newest_first: bool = True,
    ) -> list[dict[str, Any]]:
        if not self.enabled:
            return []

        params: dict[str, str | int] = {}
        if user_id is not None:
            params["user_id"] = f"eq.{user_id}"
        if limit is not None:
            params["limit"] = limit
        if newest_first:
            params["order"] = "created_at.desc"

        response = httpx.get(self._table_url(table), headers=self._headers(), params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    def get(self, table: str, record_id: str, *, user_id: str | None = None) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        params = {"id": f"eq.{record_id}", "limit": 1}
        if user_id is not None:
            params["user_id"] = f"eq.{user_id}"

        response = httpx.get(self._table_url(table), headers=self._headers(), params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

    def update(
        self,
        table: str,
        record_id: str,
        values: dict[str, Any],
        *,
        user_id: str | None = None,
    ) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        params = {"id": f"eq.{record_id}"}
        if user_id is not None:
            params["user_id"] = f"eq.{user_id}"

        response = httpx.patch(
            self._table_url(table),
            headers={**self._headers(), "Prefer": "return=representation"},
            params=params,
            json=values,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

    def delete(self, table: str, record_id: str, *, user_id: str | None = None) -> bool:
        if not self.enabled:
            return False

        params = {"id": f"eq.{record_id}"}
        if user_id is not None:
            params["user_id"] = f"eq.{user_id}"

        response = httpx.delete(self._table_url(table), headers=self._headers(), params=params, timeout=30)
        response.raise_for_status()
        return True

    def delete_where(self, table: str, **filters: Any) -> int:
        if not self.enabled:
            return 0

        params = {key: f"eq.{value}" for key, value in filters.items()}
        response = httpx.delete(
            self._table_url(table),
            headers={**self._headers(), "Prefer": "count=exact"},
            params=params,
            timeout=30,
        )
        response.raise_for_status()
        count = response.headers.get("content-range", "0/0").split("/")[-1]
        return int(count) if count.isdigit() else 0

    def upload_file(self, *, bucket: str, path: str, content: bytes, content_type: str | None) -> str | None:
        if not self.enabled:
            return None

        encoded_path = "/".join(quote(part) for part in path.split("/"))
        response = httpx.post(
            f"{self.settings.supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{encoded_path}",
            headers={
                "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
                "apikey": self.settings.supabase_service_role_key,
                "Content-Type": content_type or "application/octet-stream",
                "x-upsert": "true",
            },
            content=content,
            timeout=60,
        )
        response.raise_for_status()
        return path

    def _table_url(self, table: str) -> str:
        return f"{self.settings.supabase_url.rstrip('/')}/rest/v1/{table}"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "apikey": self.settings.supabase_service_role_key,
            "Content-Type": "application/json",
        }


supabase_client = SupabaseClient()
