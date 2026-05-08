from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth import CurrentUser, require_user
from services.rag import answer_query


router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: str = "unified"


@router.post("/query")
async def query_chat(payload: ChatRequest, user: CurrentUser = Depends(require_user)) -> dict:
    try:
        return answer_query(user.id, payload.message, payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
