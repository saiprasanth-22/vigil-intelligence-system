from fastapi import APIRouter, Depends

from middleware.auth import CurrentUser, require_user


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def me(user: CurrentUser = Depends(require_user)) -> dict[str, str]:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }
