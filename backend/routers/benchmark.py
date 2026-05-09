import asyncio
from time import perf_counter
from typing import Any

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from config import get_settings
from middleware.auth import CurrentUser, require_user


router = APIRouter(prefix="/api/benchmark", tags=["benchmark"])

GROQ_TOKEN_COST_PER_MILLION = 0.05


class BenchmarkRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class BenchmarkEvaluationRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    reference_answer: str = Field(min_length=1)
    pipeline_1_answer: str = Field(min_length=1)
    pipeline_2_answer: str = Field(min_length=1)
    pipeline_3_answer: str = Field(min_length=1)


def cost_for_tokens(tokens: int) -> float:
    return round((tokens / 1_000_000) * GROQ_TOKEN_COST_PER_MILLION, 8)


def estimate_tokens(text: str) -> int:
    return int(round(len(text.split()) * 1.3))


def calculate_bertscore_f1(reference_answer: str, candidate_answers: list[str]) -> list[float]:
    from bert_score import score

    _, _, f1_scores = score(
        candidate_answers,
        [reference_answer] * len(candidate_answers),
        lang="en",
        model_type="distilbert-base-uncased",
        num_layers=6,
        verbose=False,
    )
    return [round(float(value), 6) for value in f1_scores.tolist()]


async def judge_with_groq(question: str, reference_answer: str, answer: str) -> str:
    settings = get_settings()
    if not settings.groq_api_key:
        return "FAIL"

    prompt = (
        f"Given the question: {question}\n"
        f"Reference answer: {reference_answer}\n"
        f"Candidate answer: {answer}\n"
        "Grade this answer PASS or FAIL based on accuracy and relevance. Reply with only PASS or FAIL."
    )

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                settings.groq_base_url,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "temperature": 0,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"].strip().upper()
    except Exception:
        return "FAIL"

    return "PASS" if content.startswith("PASS") else "FAIL"


async def run_llm_only(question: str) -> dict[str, Any]:
    settings = get_settings()
    started = perf_counter()
    tokens = 0
    answer = ""

    if not settings.groq_api_key:
        latency_ms = round((perf_counter() - started) * 1000)
        return {
            "answer": "Groq API key is not configured.",
            "tokens": tokens,
            "latency_ms": latency_ms,
            "cost_usd": cost_for_tokens(tokens),
            "pipeline": "LLM-Only",
        }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                settings.groq_base_url,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "temperature": 0.1,
                    "messages": [{"role": "user", "content": question}],
                },
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"].strip()
            tokens = int((data.get("usage") or {}).get("total_tokens") or 0)
    except Exception as exc:
        answer = f"Pipeline failed: {exc}"

    latency_ms = round((perf_counter() - started) * 1000)
    return {
        "answer": answer,
        "tokens": tokens,
        "latency_ms": latency_ms,
        "cost_usd": cost_for_tokens(tokens),
        "pipeline": "LLM-Only",
    }


async def run_vector_rag(question: str) -> dict[str, Any]:
    settings = get_settings()
    started = perf_counter()
    tokens = 0
    answer = ""
    sources: list[str] = []

    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                settings.benchmark_vector_rag_url,
                headers={"Authorization": f"Bearer {settings.benchmark_vector_rag_token}"},
                json={"message": question, "mode": "library"},
            )
            response.raise_for_status()
            data = response.json()
            answer = data.get("answer", "")
            tokens = int(data.get("tokens") or 0)
            sources = [
                str(source.get("file_name"))
                for source in data.get("sources", [])
                if source.get("file_name")
            ]
            latency_ms = int(data.get("latency_ms") or round((perf_counter() - started) * 1000))
    except Exception as exc:
        answer = f"Pipeline failed: {exc}"
        latency_ms = round((perf_counter() - started) * 1000)

    return {
        "answer": answer,
        "tokens": tokens,
        "latency_ms": latency_ms,
        "cost_usd": cost_for_tokens(tokens),
        "sources": sources,
        "pipeline": "Vector RAG",
    }


async def run_graphrag(question: str) -> dict[str, Any]:
    settings = get_settings()
    started = perf_counter()
    answer = ""

    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                settings.benchmark_graphrag_url,
                auth=(settings.benchmark_graphrag_username, settings.benchmark_graphrag_password),
                json={"query": question, "method": "hybrid_search"},
            )
            response.raise_for_status()
            data = response.json()
            answer = data.get("natural_language_response", "")
    except Exception as exc:
        answer = f"Pipeline failed: {exc}"

    latency_ms = round((perf_counter() - started) * 1000)
    tokens = estimate_tokens(answer)
    return {
        "answer": answer,
        "tokens": tokens,
        "latency_ms": latency_ms,
        "cost_usd": cost_for_tokens(tokens),
        "pipeline": "GraphRAG",
    }


@router.post("/compare")
async def compare_pipelines(
    payload: BenchmarkRequest,
    user: CurrentUser = Depends(require_user),
) -> dict[str, Any]:
    del user
    pipeline_1, pipeline_2, pipeline_3 = await asyncio.gather(
        run_llm_only(payload.question),
        run_vector_rag(payload.question),
        run_graphrag(payload.question),
    )

    return {
        "question": payload.question,
        "pipeline_1": pipeline_1,
        "pipeline_2": pipeline_2,
        "pipeline_3": pipeline_3,
    }


@router.post("/evaluate")
async def evaluate_pipelines(
    payload: BenchmarkEvaluationRequest,
    user: CurrentUser = Depends(require_user),
) -> dict[str, Any]:
    del user
    candidate_answers = [
        payload.pipeline_1_answer,
        payload.pipeline_2_answer,
        payload.pipeline_3_answer,
    ]

    bertscore_task = asyncio.to_thread(
        calculate_bertscore_f1,
        payload.reference_answer,
        candidate_answers,
    )
    judge_tasks = [
        judge_with_groq(payload.question, payload.reference_answer, answer)
        for answer in candidate_answers
    ]

    bertscore_f1, judge_results = await asyncio.gather(
        bertscore_task,
        asyncio.gather(*judge_tasks),
    )

    return {
        "pipeline_1": {
            "bertscore_f1": bertscore_f1[0],
            "llm_judge": judge_results[0],
        },
        "pipeline_2": {
            "bertscore_f1": bertscore_f1[1],
            "llm_judge": judge_results[1],
        },
        "pipeline_3": {
            "bertscore_f1": bertscore_f1[2],
            "llm_judge": judge_results[2],
        },
    }
