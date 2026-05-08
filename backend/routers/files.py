from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from db.hybrid_store import store
from middleware.auth import CurrentUser, require_user
from services.chunker import chunk_text
from services.file_storage import save_raw_upload
from services.file_parser import parse_file
from services.logger import log_action, log_error
from services.vector_store import delete_file_vectors, upsert_chunk_vector


router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload")
async def upload_file(
    upload: UploadFile = File(...),
    user: CurrentUser = Depends(require_user),
) -> dict:
    content = await upload.read()

    try:
        text = parse_file(upload.filename or "upload", content)
        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("No usable text found in file.")
    except Exception as exc:
        log_error(user_id=user.id, action="file_upload", message=str(exc))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    file_record = store.insert(
        "files",
        {
            "user_id": user.id,
            "name": upload.filename,
            "content_type": upload.content_type,
            "size": len(content),
            "status": "processing",
            "chunk_count": 0,
            "storage_path": save_raw_upload(
                user_id=user.id,
                filename=upload.filename or "upload",
                content=content,
                content_type=upload.content_type,
            ),
        },
    )

    for index, chunk in enumerate(chunks):
        chunk_record = store.insert(
            "chunks",
            {
                "user_id": user.id,
                "file_id": file_record["id"],
                "chunk_index": index,
                "text": chunk,
                "file_name": upload.filename,
            },
        )
        upsert_chunk_vector(
            user_id=user.id,
            file_id=file_record["id"],
            chunk_id=chunk_record["id"],
            text=chunk,
            metadata={
                "file_name": upload.filename,
                "chunk_index": index,
            },
        )

    file_record = store.update(
        "files",
        file_record["id"],
        {"status": "ready", "chunk_count": len(chunks)},
        user_id=user.id,
    )
    log_action(user_id=user.id, action="file_upload", metadata={"file_id": file_record["id"]})

    return {"file": file_record}


@router.get("")
async def list_files(user: CurrentUser = Depends(require_user)) -> dict:
    return {"files": store.list("files", user_id=user.id)}


@router.get("/{file_id}/status")
async def file_status(file_id: str, user: CurrentUser = Depends(require_user)) -> dict:
    file_record = store.get("files", file_id, user_id=user.id)
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return {"file": file_record}


@router.delete("/{file_id}")
async def delete_file(file_id: str, user: CurrentUser = Depends(require_user)) -> dict:
    file_record = store.get("files", file_id, user_id=user.id)
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    deleted_chunks = store.delete_where("chunks", user_id=user.id, file_id=file_id)
    deleted_vectors = delete_file_vectors(user.id, file_id)
    store.delete("files", file_id, user_id=user.id)
    log_action(user_id=user.id, action="file_delete", metadata={"file_id": file_id})

    return {
        "deleted": True,
        "chunks_deleted": deleted_chunks,
        "vectors_deleted": deleted_vectors,
    }
