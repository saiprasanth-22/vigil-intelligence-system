from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import admin, auth, benchmark, chat, files, live, visualizer
from services.qdrant_store import qdrant_store


settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(chat.router)
app.include_router(live.router)
app.include_router(admin.router)
app.include_router(visualizer.router)
app.include_router(benchmark.router)


@app.on_event("startup")
async def warm_qdrant_index() -> None:
    try:
        qdrant_store.warm_collection(user_id="demo-user")
    except Exception:
        pass


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }
