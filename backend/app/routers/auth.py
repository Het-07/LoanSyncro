from fastapi import APIRouter, Depends, HTTPException, status
router = APIRouter()

# You can add a simple health check or info endpoint if desired
@router.get("/health", response_model=dict)
async def health_check():
    return {"status": "ok", "message": "Auth service is operational."}

@router.get("/")
async def auth_root():
    return {"message": "Auth service is running. Authentication handled by AWS Cognito."}
