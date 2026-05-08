import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from threading import RLock
from typing import Any


class LocalStore:
    def __init__(self, path: str | None = None) -> None:
        self.path = Path(path) if path else Path(__file__).resolve().parents[1] / "data" / "store.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        self._data = self._load()

    def _load(self) -> dict[str, list[dict[str, Any]]]:
        if not self.path.exists():
            return self._empty()

        try:
            with self.path.open("r", encoding="utf-8") as file:
                data = json.load(file)
        except json.JSONDecodeError:
            data = self._empty()

        empty = self._empty()
        for key, value in empty.items():
            data.setdefault(key, value)
        return data

    def _save(self) -> None:
        with self.path.open("w", encoding="utf-8") as file:
            json.dump(self._data, file, indent=2)

    @staticmethod
    def _empty() -> dict[str, list[dict[str, Any]]]:
        return {
            "files": [],
            "chunks": [],
            "vectors": [],
            "live_events": [],
            "chat_history": [],
            "logs": [],
            "errors": [],
            "rag_traces": [],
        }

    @staticmethod
    def now() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def new_id() -> str:
        return str(uuid.uuid4())

    def insert(self, table: str, record: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            item = {
                "id": record.get("id") or self.new_id(),
                "created_at": record.get("created_at") or self.now(),
                **record,
            }
            self._data[table].append(item)
            self._save()
            return item

    def list(
        self,
        table: str,
        *,
        user_id: str | None = None,
        limit: int | None = None,
        newest_first: bool = True,
    ) -> list[dict[str, Any]]:
        with self._lock:
            items = list(self._data[table])

        if user_id is not None:
            items = [item for item in items if item.get("user_id") == user_id]

        if newest_first:
            items.sort(key=lambda item: item.get("created_at", ""), reverse=True)

        if limit is not None:
            items = items[:limit]

        return items

    def get(self, table: str, record_id: str, *, user_id: str | None = None) -> dict[str, Any] | None:
        with self._lock:
            for item in self._data[table]:
                if item.get("id") != record_id:
                    continue
                if user_id is not None and item.get("user_id") != user_id:
                    continue
                return dict(item)
        return None

    def update(
        self,
        table: str,
        record_id: str,
        values: dict[str, Any],
        *,
        user_id: str | None = None,
    ) -> dict[str, Any] | None:
        with self._lock:
            for item in self._data[table]:
                if item.get("id") != record_id:
                    continue
                if user_id is not None and item.get("user_id") != user_id:
                    continue
                item.update(values)
                item["updated_at"] = self.now()
                self._save()
                return dict(item)
        return None

    def delete(self, table: str, record_id: str, *, user_id: str | None = None) -> bool:
        with self._lock:
            original_count = len(self._data[table])
            self._data[table] = [
                item
                for item in self._data[table]
                if not (
                    item.get("id") == record_id
                    and (user_id is None or item.get("user_id") == user_id)
                )
            ]
            deleted = len(self._data[table]) != original_count
            if deleted:
                self._save()
            return deleted

    def delete_where(self, table: str, **filters: Any) -> int:
        with self._lock:
            original_count = len(self._data[table])
            self._data[table] = [
                item
                for item in self._data[table]
                if not all(item.get(key) == value for key, value in filters.items())
            ]
            deleted = original_count - len(self._data[table])
            if deleted:
                self._save()
            return deleted

    def clear_user(self, user_id: str) -> None:
        with self._lock:
            for table in self._data:
                self._data[table] = [item for item in self._data[table] if item.get("user_id") != user_id]
            self._save()


store = LocalStore()
