from typing import Any

from db.hybrid_store import store


def log_action(
    *,
    user_id: str | None,
    action: str,
    success: bool = True,
    latency_ms: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return store.insert(
        "logs",
        {
            "user_id": user_id,
            "action": action,
            "success": success,
            "latency_ms": latency_ms,
            "metadata": metadata or {},
        },
    )


def log_error(
    *,
    user_id: str | None,
    action: str,
    message: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return store.insert(
        "errors",
        {
            "user_id": user_id,
            "action": action,
            "message": message,
            "metadata": metadata or {},
        },
    )
