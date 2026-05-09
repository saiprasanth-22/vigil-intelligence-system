from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_PATH = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    app_name: str = "Hybrid AI Data Intelligence Platform"
    environment: str = "development"
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    demo_auth_token: str = "dev-demo-token"
    dev_auth_token: str = "local-dev-token"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    groq_base_url: str = "https://api.groq.com/openai/v1/chat/completions"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    benchmark_vector_rag_url: str = "http://localhost:8081/api/chat/query"
    benchmark_graphrag_url: str = "http://localhost:8000/health_data/query"
    benchmark_vector_rag_token: str = "dev-demo-token"
    benchmark_graphrag_username: str = "tigergraph"
    benchmark_graphrag_password: str = "tigergraph"

    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() in {"development", "dev", "local", "test"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
