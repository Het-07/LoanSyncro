from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from ..models.user import UserCreate, User, Token
from ..services import auth_service
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = auth_service.get_user(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "password": user.password,  # Will be hashed in auth_service
        "created_at": datetime.utcnow().isoformat()
    }
    
    created_user = auth_service.create_user(user_data)
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Remove password from response
    created_user.pop('password', None)
    return created_user

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
