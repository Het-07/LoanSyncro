from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime
from ..models.repayment import Repayment, RepaymentCreate, Summary
from ..services import auth_service
from .loans import loans_db

router = APIRouter()

# In-memory storage for repayments
repayments_db = {}

def update_loan_status(loan_id: str):
    """Update loan status based on total repayments"""
    if loan_id not in loans_db:
        return
    
    loan = loans_db[loan_id]
    
    # Calculate total repayments for this loan
    total_repaid = sum(
        repayment["amount"] for repayment in repayments_db.values()
        if repayment["loan_id"] == loan_id
    )
    
    # Update loan status based on repayment progress
    if total_repaid >= loan["total_amount"]:
        loans_db[loan_id]["status"] = "paid"
    elif total_repaid > 0:
        loans_db[loan_id]["status"] = "active"

@router.post("/", response_model=Repayment, status_code=status.HTTP_201_CREATED)
async def create_repayment(repayment: RepaymentCreate, current_user = Depends(auth_service.get_current_user)):
    # Verify loan exists and belongs to user
    loan_id = repayment.loan_id
    if loan_id not in loans_db:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loans_db[loan_id]["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this loan")
    
    repayment_id = str(uuid.uuid4())
    repayment_data = {
        "id": repayment_id,
        "loan_id": repayment.loan_id,
        "user_id": current_user["id"],
        "amount": repayment.amount,
        "payment_date": repayment.payment_date,
        "notes": repayment.notes,
        "created_at": datetime.utcnow()
    }
    
    repayments_db[repayment_id] = repayment_data
    
    # Update loan status after adding repayment
    update_loan_status(loan_id)
    
    return repayment_data

@router.get("/", response_model=List[Repayment])
async def get_all_repayments(current_user = Depends(auth_service.get_current_user)):
    """Get all repayments for the current user"""
    user_id = current_user["id"]
    
    # Get all loans for the user first
    user_loan_ids = [loan["id"] for loan in loans_db.values() 
                    if loan["user_id"] == user_id]
    
    # Get all repayments for the user's loans
    user_repayments = [repayment for repayment in repayments_db.values() 
                      if repayment["loan_id"] in user_loan_ids]
    
    # Sort by payment date (most recent first)
    user_repayments.sort(key=lambda x: x["payment_date"], reverse=True)
    
    return user_repayments

@router.get("/loan/{loan_id}", response_model=List[Repayment])
async def get_loan_repayments(loan_id: str, current_user = Depends(auth_service.get_current_user)):
    # Verify loan exists and belongs to user
    if loan_id not in loans_db:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loans_db[loan_id]["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this loan")
    
    loan_repayments = [repayment for repayment in repayments_db.values() 
                      if repayment["loan_id"] == loan_id]
    
    # Sort by payment date (most recent first)
    loan_repayments.sort(key=lambda x: x["payment_date"], reverse=True)
    
    return loan_repayments

@router.get("/summary", response_model=Summary)
async def get_summary(current_user = Depends(auth_service.get_current_user)):
    user_id = current_user["id"]
    
    # Get all loans for the user
    user_loans = [loan for loan in loans_db.values() 
                 if loan["user_id"] == user_id]
    
    # Get all repayments for the user's loans
    loan_ids = [loan["id"] for loan in user_loans]
    user_repayments = [repayment for repayment in repayments_db.values() 
                      if repayment["loan_id"] in loan_ids]
    
    # Calculate summary values
    total_loans = len(user_loans)
    total_borrowed = sum(loan["amount"] for loan in user_loans)
    total_repaid = sum(repayment["amount"] for repayment in user_repayments)
    outstanding_amount = sum(loan["total_amount"] for loan in user_loans) - total_repaid
    
    # Find the next payment due
    next_payment_due = None
    # In a real app, you'd calculate this based on payment schedules
    
    return {
        "total_loans": total_loans,
        "total_borrowed": total_borrowed,
        "total_repaid": total_repaid,
        "outstanding_amount": outstanding_amount,
        "next_payment_due": next_payment_due
    }
