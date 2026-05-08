from services.logger import log_error
from services.supabase_client import supabase_client


def save_raw_upload(*, user_id: str, filename: str, content: bytes, content_type: str | None) -> str | None:
    path = f"uploads/{user_id}/{filename}"
    try:
        return supabase_client.upload_file(
            bucket="uploads",
            path=path,
            content=content,
            content_type=content_type,
        )
    except Exception as exc:
        log_error(user_id=user_id, action="supabase_storage_upload", message=str(exc), metadata={"path": path})
        return None
