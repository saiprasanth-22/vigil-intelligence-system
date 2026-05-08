from fastapi import APIRouter, Depends

from db.hybrid_store import store
from middleware.auth import CurrentUser, require_user
from services.anomaly import detect_anomaly
from services.logger import log_action
from services.websocket_manager import manager


router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/overview")
async def overview(user: CurrentUser = Depends(require_user)) -> dict:
    files = store.list("files", user_id=user.id)
    events = store.list("live_events", user_id=user.id)
    chats = store.list("chat_history", user_id=user.id)
    anomalies = [event for event in events if event.get("is_anomaly")]

    return {
        "files_uploaded": len(files),
        "chunks_indexed": len(store.list("chunks", user_id=user.id, newest_first=False)),
        "live_events": len(events),
        "anomalies": len(anomalies),
        "queries": len(chats),
        "active_websockets": manager.active_count(),
        "latest_file": files[0] if files else None,
        "latest_event": events[0] if events else None,
    }


@router.get("/logs")
async def logs(limit: int = 100, user: CurrentUser = Depends(require_user)) -> dict:
    return {"logs": store.list("logs", user_id=user.id, limit=max(1, min(limit, 500)))}


@router.get("/errors")
async def errors(limit: int = 100, user: CurrentUser = Depends(require_user)) -> dict:
    return {"errors": store.list("errors", user_id=user.id, limit=max(1, min(limit, 500)))}


@router.get("/rag-traces")
async def rag_traces(limit: int = 25, user: CurrentUser = Depends(require_user)) -> dict:
    return {"traces": store.list("rag_traces", user_id=user.id, limit=max(1, min(limit, 100)))}


@router.post("/trigger-anomaly")
async def trigger_anomaly(user: CurrentUser = Depends(require_user)) -> dict:
    value = 195.0
    is_anomaly, reason = detect_anomaly("vibration_hz", value)
    event = store.insert(
        "live_events",
        {
            "user_id": user.id,
            "metric": "vibration_hz",
            "value": value,
            "source": "admin_trigger",
            "is_anomaly": is_anomaly,
            "anomaly_reason": reason,
            "metadata": {"triggered_by": user.email},
        },
    )
    await manager.broadcast(user.id, {"type": "live_event", "event": event})
    log_action(user_id=user.id, action="admin_trigger_anomaly", metadata={"event_id": event["id"]})
    return {"event": event}


@router.post("/clear-demo-data")
async def clear_demo_data(user: CurrentUser = Depends(require_user)) -> dict:
    store.clear_user(user.id)
    return {"cleared": True}
