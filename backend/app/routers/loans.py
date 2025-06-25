from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import os
from ..models.loan import Loan, LoanCreate
from ..services import auth_service

router = APIRouter()

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
loans_table = dynamodb.Table(os.getenv('DYNAMODB_LOANS_TABLE', 'loansyncro-loans-dev'))

@router.post("/", response_model=Loan, status_code=status.HTTP_201_CREATED)
async def create_loan(loan: LoanCreate, current_user = Depends(auth_service.get_current_user)):
    loan_id = str(uuid.uuid4())
    
    # Calculate total amount and monthly payment
    principal = loan.amount
    rate = loan.interest_rate / 100 / 12  # Monthly interest rate
    term = loan.term_months
    
    # Formula for monthly payment: P * r * (1 + r)^n / ((1 + r)^n - 1)
    if rate > 0:
        monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
    else:
        monthly_payment = principal / term  # No interest case
    
    total_amount = monthly_payment * term
    
    loan_data = {
        "id": loan_id,
        "user_id": current_user["id"],
        "title": loan.title,
        "amount": float(loan.amount),
        "interest_rate": float(loan.interest_rate),
        "term_months": int(loan.term_months),
        "start_date": loan.start_date.isoformat(),
        "description": loan.description or "",
        "created_at": datetime.utcnow().isoformat(),
        "total_amount": float(total_amount),
        "monthly_payment": float(monthly_payment),
        "status": "active"
    }
    
    try:
        loans_table.put_item(Item=loan_data)
        return loan_data
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create loan: {str(e)}"
        )

@router.get("/", response_model=List[Loan])
async def get_loans(current_user = Depends(auth_service.get_current_user)):
    try:
        response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': current_user["id"]}
        )
        return response.get('Items', [])
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch loans: {str(e)}"
        )

@router.get("/{loan_id}", response_model=Loan)
async def get_loan(loan_id: str, current_user = Depends(auth_service.get_current_user)):
    try:
        response = loans_table.get_item(Key={'id': loan_id})
        loan = response.get('Item')
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if loan["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this loan")
        
        return loan
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch loan: {str(e)}"
        )

@router.put("/{loan_id}", response_model=Loan)
async def update_loan(loan_id: str, loan_update: LoanCreate, current_user = Depends(auth_service.get_current_user)):
    try:
        # First check if loan exists and belongs to user
        response = loans_table.get_item(Key={'id': loan_id})
        existing_loan = response.get('Item')
        
        if not existing_loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if existing_loan["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to update this loan")
        
        # Recalculate total amount and monthly payment with new values
        principal = loan_update.amount
        rate = loan_update.interest_rate / 100 / 12  # Monthly interest rate
        term = loan_update.term_months
        
        if rate > 0:
            monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
        else:
            monthly_payment = principal / term
        
        total_amount = monthly_payment * term
        
        # Update loan data
        update_expression = """
            SET title = :title,
                amount = :amount,
                interest_rate = :interest_rate,
                term_months = :term_months,
                start_date = :start_date,
                description = :description,
                total_amount = :total_amount,
                monthly_payment = :monthly_payment
        """
        
        loans_table.update_item(
            Key={'id': loan_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues={
                ':title': loan_update.title,
                ':amount': float(loan_update.amount),
                ':interest_rate': float(loan_update.interest_rate),
                ':term_months': int(loan_update.term_months),
                ':start_date': loan_update.start_date.isoformat(),
                ':description': loan_update.description or "",
                ':total_amount': float(total_amount),
                ':monthly_payment': float(monthly_payment)
            }
        )
        
        # Return updated loan
        response = loans_table.get_item(Key={'id': loan_id})
        return response.get('Item')
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update loan: {str(e)}"
        )

@router.delete("/{loan_id}")
async def delete_loan(loan_id: str, current_user = Depends(auth_service.get_current_user)):
    try:
        # First check if loan exists and belongs to user
        response = loans_table.get_item(Key={'id': loan_id})
        loan = response.get('Item')
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if loan["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this loan")
        
        loans_table.delete_item(Key={'id': loan_id})
        return {"message": "Loan deleted successfully"}
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete loan: {str(e)}"
        )
