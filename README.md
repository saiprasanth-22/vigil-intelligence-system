# Vigil - Hybrid AI Data Intelligence Platform

> Built for the GraphRAG Inference Hackathon by TigerGraph, May 2026

Vigil is an AI data intelligence platform that benchmarks three retrieval architectures - LLM-only, Vector RAG, and GraphRAG - on real-world Indian public health data from NFHS-5 covering 706 districts and roughly 2.5M tokens.

## Core Result

| Pipeline | Tokens Used | Latency | Token Reduction |
|---|---:|---:|---:|
| LLM-only | 67 | 942ms | baseline |
| Vector RAG | 1,175 | 2,012ms | - |
| **GraphRAG** | **235** | **2,029ms** | **80% vs Vector RAG** |

GraphRAG delivered an 80% token reduction versus Vector RAG while maintaining answer quality at similar latency.

## Architecture

```text
User Query
  |
  +-- Pipeline 1: Direct Groq call with no retrieval
  |
  +-- Pipeline 2: Query -> Qdrant vector search -> top-3 chunks -> Groq
  |
  +-- Pipeline 3: Query -> TigerGraph knowledge graph -> entity traversal
                 -> structured context -> Groq
```

## Stack

- Frontend: Next.js 16, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: FastAPI, Python 3.11
- Vector store: Qdrant
- Graph database: TigerGraph
- LLM: Groq, `llama-3.1-8b-instant`
- Embeddings: Ollama, `nomic-embed-text`, 768 dimensions
- Evaluation: BERTScore and LLM-as-Judge via Groq

## Dataset

- Source: NFHS-5, National Family Health Survey 2019-21
- Coverage: 706 Indian districts across all states
- Size: approximately 2.5M tokens
- Format: natural language narratives generated from 107 health indicators per district
- Domain: maternal health, child nutrition, sanitation, disease burden, and healthcare access

## Features

### Three-Pipeline Benchmark

- Runs the same health question through all three pipelines concurrently
- Compares answers, tokens, latency, and cost side by side
- Tracks answer accuracy, citation precision, latency, hallucination rate, and throughput

### Evaluation Layer

- BERTScore F1 for semantic similarity to a reference answer
- LLM-as-Judge PASS/FAIL grading through Groq
- Score trajectory chart across runs
- Recent benchmark run history

### Vigil Platform

- Library Mode: upload documents, chunk them, embed them, and query with RAG
- Live Mode: ingest real-time events and detect anomalies
- Unified Chat: query across uploaded library data and live events
- Visualizer: view document and activity insights

## Local Setup

### Prerequisites

- Python 3.11
- Node.js LTS
- Docker Desktop
- Ollama
- Groq API key

### Backend

```bash
git clone https://github.com/saiprasanth-22/vigil-intelligence-system
cd vigil-intelligence-system/backend

cp .env.example .env
# Fill in GROQ_API_KEY, QDRANT_URL, QDRANT_API_KEY, and any optional Supabase values.

pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Frontend

```bash
cd "Ui design"
npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
echo "NEXT_PUBLIC_AUTH_TOKEN=dev-demo-token" >> .env.local

npm run dev
```

The frontend runs at `http://localhost:3000` by default.

### GraphRAG Pipeline

The TigerGraph GraphRAG stack is run separately with Docker.

```bash
docker compose up -d
```

Once the GraphRAG services are running, the benchmark backend expects:

- Main Vigil backend: `http://localhost:8080`
- Vector RAG backend: `http://localhost:8081`
- GraphRAG API: `http://localhost:8000`
- TigerGraph RESTPP: `http://localhost:14240`

## API Reference

### Benchmark Compare

```http
POST /api/benchmark/compare
Authorization: Bearer dev-demo-token
Content-Type: application/json

{
  "question": "Which districts have the highest maternal mortality?"
}
```

Returns `pipeline_1`, `pipeline_2`, and `pipeline_3` results with answer text, tokens, latency, and cost.

### Benchmark Evaluate

```http
POST /api/benchmark/evaluate
Authorization: Bearer dev-demo-token
Content-Type: application/json

{
  "question": "...",
  "reference_answer": "...",
  "pipeline_1_answer": "...",
  "pipeline_2_answer": "...",
  "pipeline_3_answer": "..."
}
```

Returns BERTScore F1 and LLM-as-Judge PASS/FAIL results for each pipeline.

### Chat

```http
POST /api/chat/query
Authorization: Bearer dev-demo-token
Content-Type: application/json

{
  "message": "your question",
  "mode": "library"
}
```

Supported modes are `library`, `live`, and `unified`.

## Optimization Tuning

- Reduced Vector RAG `top_k` from 5 to 3
- Reduced GraphRAG `top_k` from 5 to 3
- Reduced GraphRAG `num_hops` from 2 to 1
- Runs all three benchmark pipelines concurrently with `asyncio.gather`
- Pre-warms the Qdrant collection on backend startup

## Deployment

Frontend production deployment:

```text
https://vigil-intelligence.vercel.app
```

For hosted benchmark calls, configure `NEXT_PUBLIC_BENCHMARK_API_URL` to point to a publicly reachable backend URL.

## Hackathon

- Event: GraphRAG Inference Hackathon by TigerGraph
- Track: proving that GraphRAG can reduce token consumption while maintaining answer quality
- Result: 80% token reduction versus Vector RAG on the Indian public health benchmark
- Dataset: NFHS-5 district health indicators, 706 districts, approximately 2.5M tokens
- Submission: solo project
