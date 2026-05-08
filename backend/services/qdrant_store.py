from typing import Any

import httpx

from config import get_settings
from services.embedder import VECTOR_SIZE


class QdrantStore:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.qdrant_url and self.settings.qdrant_api_key)

    def upsert(
        self,
        *,
        user_id: str,
        vector_id: str,
        embedding: list[float],
        payload: dict[str, Any],
    ) -> bool:
        if not self.enabled:
            return False

        collection = self._collection(user_id)
        self._ensure_collection(collection)
        response = httpx.put(
            f"{self._base_url()}/collections/{collection}/points",
            headers=self._headers(),
            json={
                "points": [
                    {
                        "id": vector_id,
                        "vector": embedding,
                        "payload": payload,
                    }
                ]
            },
            timeout=30,
        )
        response.raise_for_status()
        return True

    def search(self, *, user_id: str, query_vector: list[float], top_k: int, score_threshold: float) -> list[dict]:
        if not self.enabled:
            return []

        collection = self._collection(user_id)
        response = httpx.post(
            f"{self._base_url()}/collections/{collection}/points/search",
            headers=self._headers(),
            json={
                "vector": query_vector,
                "limit": top_k,
                "score_threshold": score_threshold,
                "with_payload": True,
            },
            timeout=30,
        )
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return response.json().get("result", [])

    def delete_file(self, *, user_id: str, file_id: str) -> bool:
        if not self.enabled:
            return False

        collection = self._collection(user_id)
        response = httpx.post(
            f"{self._base_url()}/collections/{collection}/points/delete",
            headers=self._headers(),
            json={
                "filter": {
                    "must": [
                        {
                            "key": "file_id",
                            "match": {"value": file_id},
                        }
                    ]
                }
            },
            timeout=30,
        )
        if response.status_code == 404:
            return False
        response.raise_for_status()
        return True

    def _ensure_collection(self, collection: str) -> None:
        response = httpx.get(
            f"{self._base_url()}/collections/{collection}",
            headers=self._headers(),
            timeout=30,
        )
        if response.status_code == 200:
            return
        if response.status_code != 404:
            response.raise_for_status()

        create = httpx.put(
            f"{self._base_url()}/collections/{collection}",
            headers=self._headers(),
            json={
                "vectors": {
                    "size": VECTOR_SIZE,
                    "distance": "Cosine",
                }
            },
            timeout=30,
        )
        create.raise_for_status()

    def _headers(self) -> dict[str, str]:
        return {
            "api-key": self.settings.qdrant_api_key,
            "Content-Type": "application/json",
        }

    def _base_url(self) -> str:
        return self.settings.qdrant_url.rstrip("/")

    @staticmethod
    def _collection(user_id: str) -> str:
        safe = "".join(char if char.isalnum() or char in {"_", "-"} else "_" for char in user_id)
        return f"user_{safe}"


qdrant_store = QdrantStore()
