# Project Journal

## Day 1 — May 8, 2026

**Registered:** TigerGraph GraphRAG Inference Hackathon — solo attempt.

**Decision:** Using Vigil (existing AI data intelligence platform) as the
host system. TigerGraph becomes Pipeline 3 alongside existing RAG pipeline.

**Dataset plan:** Indian district health data (NFHS-5 reports) — 2M+ tokens
from government PDF reports. CSV dataset found but insufficient (~150k tokens),
sourcing narrative PDFs instead.

**Progress:**
- Fresh Windows setup after laptop reset
- Backend fully running — health check passing
- Chat page wired to real backend — confirmed real Groq responses with citations
- API client created with auth headers
- Frontend/backend integration started (0% → chat page done)

**Blockers hit:**
- Python 3.14 compatibility issues → downgraded to 3.11.9
- CORS port mismatch (5173 vs 3000) → fixed
- Demo token auth not matching → fixed
- Chat input invisible due to vigil-input CSS class → fixed with inline styles

**Tomorrow:** File upload wiring → dataset ingestion → TigerGraph setup begins





-
