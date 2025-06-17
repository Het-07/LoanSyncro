from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .routers import loans, repayments, users, auth
from .services import auth_service

app = FastAPI(title="LoanSyncro API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"], prefix="/auth")
app.include_router(users.router, tags=["Users"], prefix="/users")
app.include_router(
    loans.router, 
    tags=["Loans"], 
    prefix="/loans",
    dependencies=[Depends(auth_service.get_current_user)]
)
app.include_router(
    repayments.router, 
    tags=["Repayments"], 
    prefix="/repayments",
    dependencies=[Depends(auth_service.get_current_user)]
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to LoanSyncro API"}