from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from db.hybrid_store import store
from middleware.auth import CurrentUser, require_user
from services.anomaly import detect_anomaly
from services.logger import log_action
from services.websocket_manager import manager


router = APIRouter(tags=["live"])


class LiveEventIn(BaseModel):
    metric: str = Field(min_length=1, max_length=80)
    value: float
    source: str = Field(default="demo_sensor", max_length=120)
    timestamp: str | None = None
    metadata: dict = Field(default_factory=dict)


@router.post("/api/live/ingest")
async def ingest_live_event(
    payload: LiveEventIn,
    user: CurrentUser = Depends(require_user),
) -> dict:
    is_anomaly, reason = detect_anomaly(payload.metric, payload.value)
    event = store.insert(
        "live_events",
        {
            "user_id": user.id,
            "metric": payload.metric,
            "value": payload.value,
            "source": payload.source,
            "timestamp": payload.timestamp,
            "metadata": payload.metadata,
            "is_anomaly": is_anomaly,
            "anomaly_reason": reason,
        },
    )
    await manager.broadcast(user.id, {"type": "live_event", "event": event})
    log_action(user_id=user.id, action="live_ingest", metadata={"event_id": event["id"]})
    return {"event": event}


@router.get("/api/live/events")
async def list_live_events(
    limit: int = 50,
    user: CurrentUser = Depends(require_user),
) -> dict:
    return {"events": store.list("live_events", user_id=user.id, limit=max(1, min(limit, 200)))}


@router.websocket("/ws/live/{user_id}")
async def live_socket(websocket: WebSocket, user_id: str) -> None:
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
