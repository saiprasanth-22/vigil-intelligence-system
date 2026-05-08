# Project Context

Platform: Hybrid AI Data Intelligence Platform

Backend stack: FastAPI, local JSON store fallback, deterministic local embeddings.

Current backend status:
- Health endpoint works.
- Demo bearer auth works.
- File upload parses TXT, CSV, PDF.
- Text chunks are embedded and stored locally.
- Chat uses Groq when `GROQ_API_KEY` is set, with local fallback if Groq fails.
- Live event ingestion detects threshold anomalies.
- Admin data endpoints are available for frontend UI.
- Visualizer data endpoints are available for frontend 3D.
- Backend can run with `backend/run.ps1` in this Windows workspace.

External integrations not connected yet:
Cloud integrations:
- Groq chat generation uses `GROQ_API_KEY`.
- Qdrant is used for vector upsert/search/delete when `QDRANT_URL` and `QDRANT_API_KEY` are set.
- Supabase PostgREST/storage are used when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- Supabase JWT auth is accepted when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set.

Verification:
- Syntax compile passed across backend modules.
- Local store pytest passed with vendored dependencies.
- FastAPI app import passed.
- In-process smoke test passed for `/health`, `/api/auth/me`, `/api/live/ingest`, and `/api/chat/query`.

Demo auth token:
- `dev-demo-token`
