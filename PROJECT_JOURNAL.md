# Project Journal - Vigil x TigerGraph GraphRAG Inference Hackathon

## Day 1 - May 9, 2026

**Registered:** TigerGraph GraphRAG Inference Hackathon, solo attempt.

**Decision:** Use Vigil, an existing hybrid AI data intelligence platform, as the host system. TigerGraph becomes Pipeline 3 alongside Vigil's existing Qdrant RAG pipeline. One codebase, three retrieval architectures.

**Dataset decision:** Indian district health data from NFHS-5: 706 districts with 107 health indicators per district. The structured CSV alone was not enough for a meaningful retrieval benchmark, so each district row was converted into a natural language narrative with a Python script. Final size: 2.5M tokens across 706 text files.

**Progress:**

- Fresh Windows setup after laptop reset, including Python version issues, WSL corruption, and Docker setup
- Vigil backend running on port 8080 with health checks passing
- Chat page wired to the real Groq backend and confirmed with cited responses
- API client created with auth headers
- Frontend/backend integration started, with chat page completed first

**Blockers hit and fixed:**

- Python 3.14 was installed accidentally, then downgraded to Python 3.11.9
- CORS port mismatch between 5173 and 3000 fixed in `.env`
- Demo token auth mismatch fixed in config
- Chat input invisibility caused by `vigil-input` CSS fixed with explicit styling
- WSL corruption required a reinstall
- Docker container conflicts were cleaned up and restarted

**Next target:** TigerGraph Savanna setup, GraphRAG Docker, dataset ingestion, and Pipeline 3 integration.

---

## Day 2 - May 10, 2026

**Goal:** Get all three pipelines working and make the benchmark dashboard live.

**TigerGraph setup:**

- Created a TigerGraph Savanna account and starter workgroup
- Chose the local Docker route for GraphRAG after Savanna DNS resolution failed inside Docker containers
- Fixed WSL and Docker Desktop issues after corrupted WSL and registry problems
- Started the GraphRAG Docker stack with all services running
- Logged into the GraphRAG UI at `localhost:80`
- Initialized the knowledge graph for the `health_data` graph

**Dataset ingestion:**

- Uploaded 706 district narrative files to TigerGraph through the `/ui/health_data/uploads` API
- Triggered knowledge graph rebuild through `POST /ui/health_data/rebuild_graph`
- Rebuild completed with extracted entities, mapped relationships, and detected communities
- Uploaded the same 706 files to Vigil's Qdrant pipeline through `/api/files/upload`
- Indexed 9,933 chunks in Qdrant

**All three pipelines working:**

Pipeline 1 - LLM-only:

- Direct Groq call with no retrieval
- 67 tokens, about 942ms
- Fast, but can hallucinate specific statistics

Pipeline 2 - Vector RAG:

- Vigil Qdrant cosine similarity search with top-3 chunks
- 1,175 tokens, about 2,012ms
- Retrieves useful chunks, but can pull the wrong district or state when semantic matches are close

Pipeline 3 - GraphRAG:

- TigerGraph entity traversal with top-3 results and depth-1 traversal
- 235 tokens, about 2,029ms
- Structured, grounded, and honest about what is or is not in the retrieved context

**Key result:** GraphRAG used about 80% fewer tokens than Vector RAG at similar latency.

**Benchmark dashboard built:**

- `POST /api/benchmark/compare` runs all three pipelines concurrently with `asyncio.gather`
- `POST /api/benchmark/evaluate` runs BERTScore F1 and LLM-as-Judge PASS/FAIL per pipeline
- Frontend has a three-column comparison with metrics, score trajectory chart, and recent runs table
- Comparison table includes answer accuracy, citation precision, latency, hallucination rate, and throughput

**Latency optimization:**

- Reduced `top_k` from 5 to 3 for both Qdrant and TigerGraph retrieval
- Reduced `num_hops` from 2 to 1 for TigerGraph graph traversal
- Pre-warmed Qdrant on backend startup
- Confirmed all benchmark pipelines run concurrently

**UI work:**

- Removed hardcoded mock data from dashboard, library, live, chat, and visualizer pages
- Fixed sidebar glow and active indicator positioning
- Applied Vigil dark theme consistently across the benchmark page

**End-of-day state:**

- All three pipelines working
- Benchmark dashboard live locally at `localhost:3001/benchmark`
- BERTScore and LLM-as-Judge evaluation working
- UI cleaned of mock data
- README written
- Video script prepared

**Next target:** Final GitHub push, Vercel deployment, demo video recording, Hashnode blog post, and Unstop submission.
