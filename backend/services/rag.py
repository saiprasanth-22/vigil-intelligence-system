from time import perf_counter
from typing import Any

from db.hybrid_store import store
from services.groq_client import generate_answer_with_usage
from services.logger import log_action
from services.vector_store import search_chunks


VALID_MODES = {"library", "live", "unified"}


def answer_query(user_id: str, message: str, mode: str = "unified") -> dict[str, Any]:
    if mode not in VALID_MODES:
        raise ValueError("mode must be library, live, or unified")

    started = perf_counter()
    sources = []
    retrieved_chunks = []
    live_events = []
    tokens = 0

    if mode in {"library", "unified"}:
        retrieved_chunks = search_chunks(user_id, message, top_k=3)
        sources.extend(
            {
                "type": "file",
                "file_id": chunk["file_id"],
                "chunk_id": chunk["chunk_id"],
                "file_name": chunk["metadata"].get("file_name", "unknown"),
                "chunk_index": chunk["metadata"].get("chunk_index", 0),
                "score": chunk["score"],
            }
            for chunk in retrieved_chunks
        )

    if mode in {"live", "unified"}:
        live_events = store.list("live_events", user_id=user_id, limit=10)
        sources.extend(
            {
                "type": "live_event",
                "event_id": event["id"],
                "metric": event.get("metric"),
                "value": event.get("value"),
                "is_anomaly": event.get("is_anomaly", False),
            }
            for event in live_events[:5]
        )

    try:
        generation = generate_answer_with_usage(
            question=message,
            mode=mode,
            historical_context=retrieved_chunks,
            live_context=live_events,
        )
        if generation:
            answer = generation["answer"]
            tokens = int(generation.get("tokens") or 0)
        else:
            answer = None
    except Exception as exc:
        answer = None
        store.insert(
            "errors",
            {
                "user_id": user_id,
                "action": "groq_generate",
                "message": str(exc),
                "metadata": {"mode": mode},
            },
        )

    if not answer:
        answer = _fallback_answer(message, mode, retrieved_chunks, live_events)
    latency_ms = round((perf_counter() - started) * 1000)

    chat = store.insert(
        "chat_history",
        {
            "user_id": user_id,
            "message": message,
            "mode": mode,
            "answer": answer,
            "sources": sources,
            "latency_ms": latency_ms,
            "tokens": tokens,
        },
    )
    store.insert(
        "rag_traces",
        {
            "user_id": user_id,
            "chat_id": chat["id"],
            "query": message,
            "mode": mode,
            "retrieved_chunks": retrieved_chunks,
            "live_events": live_events,
        },
    )
    log_action(user_id=user_id, action="chat_query", latency_ms=latency_ms, metadata={"mode": mode})

    return {
        "answer": answer,
        "sources": sources,
        "latency_ms": latency_ms,
        "tokens": tokens,
        "mode": mode,
    }


def _fallback_answer(
    message: str,
    mode: str,
    chunks: list[dict[str, Any]],
    events: list[dict[str, Any]],
) -> str:
    parts = [f"Local response for: {message}"]

    if mode in {"library", "unified"}:
        if chunks:
            best = chunks[0]
            file_name = best["metadata"].get("file_name", "uploaded file")
            parts.append(
                f"Best document match is {file_name}, chunk {best['metadata'].get('chunk_index', 0)}, score {best['score']}."
            )
            parts.append(best["text"][:500])
        else:
            parts.append("No relevant uploaded document chunks were found.")

    if mode in {"live", "unified"}:
        if events:
            latest = events[0]
            status = "anomaly" if latest.get("is_anomaly") else "normal"
            parts.append(
                f"Latest live event: {latest.get('metric')}={latest.get('value')} from {latest.get('source')} ({status})."
            )
        else:
            parts.append("No live events are available yet.")

    return "\n\n".join(parts)
