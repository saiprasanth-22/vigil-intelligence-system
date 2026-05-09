from typing import Any

import httpx

from config import get_settings


def generate_answer_with_usage(
    *,
    question: str,
    mode: str,
    historical_context: list[dict[str, Any]],
    live_context: list[dict[str, Any]],
) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.groq_api_key:
        return None

    prompt = _build_prompt(
        question=question,
        mode=mode,
        historical_context=historical_context,
        live_context=live_context,
    )

    response = httpx.post(
        settings.groq_base_url,
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.groq_model,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You answer questions using only the provided historical and live context. "
                        "If the context is insufficient, say that clearly. Include source references when useful."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    usage = data.get("usage") or {}
    return {
        "answer": data["choices"][0]["message"]["content"].strip(),
        "tokens": int(usage.get("total_tokens") or 0),
    }


def generate_answer(
    *,
    question: str,
    mode: str,
    historical_context: list[dict[str, Any]],
    live_context: list[dict[str, Any]],
) -> str | None:
    result = generate_answer_with_usage(
        question=question,
        mode=mode,
        historical_context=historical_context,
        live_context=live_context,
    )
    if not result:
        return None
    return str(result["answer"])


def _build_prompt(
    *,
    question: str,
    mode: str,
    historical_context: list[dict[str, Any]],
    live_context: list[dict[str, Any]],
) -> str:
    history_lines = []
    for item in historical_context:
        metadata = item.get("metadata", {})
        label = f"{metadata.get('file_name', 'unknown file')} chunk {metadata.get('chunk_index', 0)}"
        history_lines.append(f"[{label} | score={item.get('score')}]\n{item.get('text', '')}")

    live_lines = []
    for event in live_context:
        status = "ANOMALY" if event.get("is_anomaly") else "normal"
        live_lines.append(
            f"[{event.get('created_at')}] {event.get('source')} {event.get('metric')}={event.get('value')} ({status})"
        )

    return "\n\n".join(
        [
            f"Mode: {mode}",
            f"Question: {question}",
            "[HISTORICAL CONTEXT]",
            "\n\n".join(history_lines) if history_lines else "No historical context.",
            "[LIVE CONTEXT]",
            "\n".join(live_lines) if live_lines else "No live context.",
        ]
    )
