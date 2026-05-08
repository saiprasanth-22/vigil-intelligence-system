from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        if websocket in self.connections[user_id]:
            self.connections[user_id].remove(websocket)

    async def broadcast(self, user_id: str, payload: dict[str, Any]) -> None:
        stale = []
        for websocket in self.connections[user_id]:
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                stale.append(websocket)

        for websocket in stale:
            self.disconnect(user_id, websocket)

    def active_count(self) -> int:
        return sum(len(items) for items in self.connections.values())


manager = WebSocketManager()
