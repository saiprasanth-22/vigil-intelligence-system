from typing import Any

from db.local_store import LocalStore
from services.supabase_client import supabase_client


class HybridStore:
    def __init__(self) -> None:
        self.local = LocalStore()

    def insert(self, table: str, record: dict[str, Any]) -> dict[str, Any]:
        item = self.local.insert(table, record)
        try:
            remote = supabase_client.insert(table, item)
            return remote or item
        except Exception:
            return item

    def list(
        self,
        table: str,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        newest_first: bool = True,
    ) -> list[dict[str, Any]]:
        try:
            remote = supabase_client.list(table, user_id=user_id, limit=limit, newest_first=newest_first)
            if remote:
                return remote
        except Exception:
            pass
        return self.local.list(table, user_id=user_id, limit=limit, newest_first=newest_first)

    def get(self, table: str, record_id: str, *, user_id: str | None = None) -> dict[str, Any] | None:
        try:
            remote = supabase_client.get(table, record_id, user_id=user_id)
            if remote:
                return remote
        except Exception:
            pass
        return self.local.get(table, record_id, user_id=user_id)

    def update(
        self,
        table: str,
        record_id: str,
        values: dict[str, Any],
        *,
        user_id: str | None = None,
    ) -> dict[str, Any] | None:
        local = self.local.update(table, record_id, values, user_id=user_id)
        try:
            remote = supabase_client.update(table, record_id, values, user_id=user_id)
            return remote or local
        except Exception:
            return local

    def delete(self, table: str, record_id: str, *, user_id: str | None = None) -> bool:
        local_deleted = self.local.delete(table, record_id, user_id=user_id)
        try:
            remote_deleted = supabase_client.delete(table, record_id, user_id=user_id)
            return remote_deleted or local_deleted
        except Exception:
            return local_deleted

    def delete_where(self, table: str, **filters: Any) -> int:
        local_deleted = self.local.delete_where(table, **filters)
        try:
            supabase_client.delete_where(table, **filters)
        except Exception:
            pass
        return local_deleted

    def clear_user(self, user_id: str) -> None:
        for table in self.local._empty():
            self.delete_where(table, user_id=user_id)


store = HybridStore()
