from fastapi import APIRouter, Depends, HTTPException
from ..services import auth_service
from ..models.user import User

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(current_user = Depends(auth_service.get_current_user)):
    return current_user