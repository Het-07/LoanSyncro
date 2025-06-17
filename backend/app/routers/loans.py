from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime
from ..models.loan import Loan, LoanCreate
from ..services import auth_service

router = APIRouter()

# In-memory storage for loans
loans_db = {}

@router.post("/", response_model=Loan, status_code=status.HTTP_201_CREATED)
async def create_loan(loan: LoanCreate, current_user = Depends(auth_service.get_current_user)):
    loan_id = str(uuid.uuid4())
    
    # Calculate total amount and monthly payment
    principal = loan.amount
    rate = loan.interest_rate / 100 / 12  # Monthly interest rate
    term = loan.term_months
    
    # Formula for monthly payment: P * r * (1 + r)^n / ((1 + r)^n - 1)
    monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
    total_amount = monthly_payment * term
    
    loan_data = {
        "id": loan_id,
        "user_id": current_user["id"],
        "title": loan.title,
        "amount": loan.amount,
        "interest_rate": loan.interest_rate,
        "term_months": loan.term_months,
        "start_date": loan.start_date,
        "description": loan.description,
        "created_at": datetime.utcnow(),
        "total_amount": total_amount,
        "monthly_payment": monthly_payment,
        "status": "active"
    }
    
    if loan_id not in loans_db:
        loans_db[loan_id] = loan_data
    
    return loan_data

@router.get("/", response_model=List[Loan])
async def get_loans(current_user = Depends(auth_service.get_current_user)):
    user_loans = [loan for loan in loans_db.values() 
                 if loan["user_id"] == current_user["id"]]
    return user_loans

@router.get("/{loan_id}", response_model=Loan)
async def get_loan(loan_id: str, current_user = Depends(auth_service.get_current_user)):
    if loan_id not in loans_db:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    loan = loans_db[loan_id]
    if loan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this loan")
    
    return loan