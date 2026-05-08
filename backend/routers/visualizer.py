from fastapi import APIRouter, Depends

from db.hybrid_store import store
from middleware.auth import CurrentUser, require_user
from services.embedder import cosine_similarity


router = APIRouter(prefix="/api/visualizer", tags=["visualizer"])


@router.get("/document-graph")
async def document_graph(user: CurrentUser = Depends(require_user)) -> dict:
    files = store.list("files", user_id=user.id, newest_first=False)
    vectors = store.list("vectors", user_id=user.id, newest_first=False)
    vectors_by_file: dict[str, list[list[float]]] = {}

    for vector in vectors:
        vectors_by_file.setdefault(vector["file_id"], []).append(vector["embedding"])

    nodes = [
        {
            "id": file["id"],
            "label": file["name"],
            "type": _file_type(file["name"]),
            "size": max(1, file.get("chunk_count", 1)),
            "status": file.get("status", "unknown"),
        }
        for file in files
    ]

    centroids = {
        file_id: _centroid(embeddings)
        for file_id, embeddings in vectors_by_file.items()
        if embeddings
    }
    edges = []

    for index, source in enumerate(files):
        for target in files[index + 1 :]:
            left = centroids.get(source["id"])
            right = centroids.get(target["id"])
            if not left or not right:
                continue
            weight = cosine_similarity(left, right)
            if weight >= 0.25:
                edges.append(
                    {
                        "source": source["id"],
                        "target": target["id"],
                        "weight": round(weight, 4),
                    }
                )

    return {"nodes": nodes, "edges": edges}


@router.get("/live-particles")
async def live_particles(limit: int = 100, user: CurrentUser = Depends(require_user)) -> dict:
    events = store.list("live_events", user_id=user.id, limit=max(1, min(limit, 500)))
    particles = [
        {
            "id": event["id"],
            "metric": event.get("metric"),
            "value": event.get("value"),
            "source": event.get("source"),
            "is_anomaly": event.get("is_anomaly", False),
            "intensity": min(abs(float(event.get("value") or 0)) / 200, 2),
            "created_at": event.get("created_at"),
        }
        for event in events
    ]
    return {"particles": particles}


def _file_type(name: str) -> str:
    extension = name.rsplit(".", 1)[-1].lower() if "." in name else "unknown"
    return extension


def _centroid(vectors: list[list[float]]) -> list[float]:
    size = len(vectors[0])
    total = [0.0] * size

    for vector in vectors:
        for index, value in enumerate(vector):
            total[index] += value

    return [value / len(vectors) for value in total]
