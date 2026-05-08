from typing import Any

from db.hybrid_store import store
from services.embedder import cosine_similarity, embed_text
from services.logger import log_error
from services.qdrant_store import qdrant_store


def upsert_chunk_vector(
    *,
    user_id: str,
    file_id: str,
    chunk_id: str,
    text: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    embedding = embed_text(text)
    store.delete_where("vectors", chunk_id=chunk_id)
    vector = store.insert(
        "vectors",
        {
            "user_id": user_id,
            "file_id": file_id,
            "chunk_id": chunk_id,
            "embedding": embedding,
            "metadata": metadata,
        },
    )
    try:
        qdrant_store.upsert(
            user_id=user_id,
            vector_id=chunk_id,
            embedding=embedding,
            payload={
                "user_id": user_id,
                "file_id": file_id,
                "chunk_id": chunk_id,
                "text": text,
                **metadata,
            },
        )
    except Exception as exc:
        log_error(user_id=user_id, action="qdrant_upsert", message=str(exc), metadata={"file_id": file_id})
    return vector


def search_chunks(user_id: str, query: str, top_k: int = 5, score_threshold: float = 0.15) -> list[dict[str, Any]]:
    query_vector = embed_text(query)
    try:
        qdrant_results = qdrant_store.search(
            user_id=user_id,
            query_vector=query_vector,
            top_k=top_k,
            score_threshold=score_threshold,
        )
        if qdrant_results:
            return [_map_qdrant_result(result) for result in qdrant_results]
    except Exception as exc:
        log_error(user_id=user_id, action="qdrant_search", message=str(exc))

    results = []

    for vector in store.list("vectors", user_id=user_id, newest_first=False):
        score = cosine_similarity(query_vector, vector["embedding"])
        if score < score_threshold:
            continue

        chunk = store.get("chunks", vector["chunk_id"], user_id=user_id)
        if not chunk:
            continue

        results.append(
            {
                "score": round(score, 4),
                "chunk_id": vector["chunk_id"],
                "file_id": vector["file_id"],
                "text": chunk["text"],
                "metadata": vector.get("metadata", {}),
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    return results[:top_k]


def delete_file_vectors(user_id: str, file_id: str) -> int:
    try:
        qdrant_store.delete_file(user_id=user_id, file_id=file_id)
    except Exception as exc:
        log_error(user_id=user_id, action="qdrant_delete_file", message=str(exc), metadata={"file_id": file_id})
    return store.delete_where("vectors", user_id=user_id, file_id=file_id)


def _map_qdrant_result(result: dict[str, Any]) -> dict[str, Any]:
    payload = result.get("payload", {})
    return {
        "score": round(float(result.get("score", 0)), 4),
        "chunk_id": payload.get("chunk_id"),
        "file_id": payload.get("file_id"),
        "text": payload.get("text", ""),
        "metadata": {
            "file_name": payload.get("file_name", "unknown"),
            "chunk_index": payload.get("chunk_index", 0),
        },
    }
