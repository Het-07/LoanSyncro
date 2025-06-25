from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import os
from ..models.repayment import Repayment, RepaymentCreate, Summary
from ..services import auth_service

router = APIRouter()

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
repayments_table = dynamodb.Table(os.getenv('DYNAMODB_REPAYMENTS_TABLE', 'loansyncro-repayments-dev'))
loans_table = dynamodb.Table(os.getenv('DYNAMODB_LOANS_TABLE', 'loansyncro-loans-dev'))

def update_loan_status(loan_id: str):
    """Update loan status based on total repayments"""
    try:
        # Get loan details
        loan_response = loans_table.get_item(Key={'id': loan_id})
        loan = loan_response.get('Item')
        
        if not loan:
            return
        
        # Calculate total repayments for this loan
        repayments_response = repayments_table.query(
            IndexName='loan-id-index',
            KeyConditionExpression='loan_id = :loan_id',
            ExpressionAttributeValues={':loan_id': loan_id}
        )
        
        total_repaid = sum(
            float(repayment.get('amount', 0)) 
            for repayment in repayments_response.get('Items', [])
        )
        
        # Update loan status based on repayment progress
        new_status = loan.get('status', 'active')
        if total_repaid >= float(loan.get('total_amount', 0)):
            new_status = 'paid'
        elif total_repaid > 0:
            new_status = 'active'
        
        # Update loan status if changed
        if new_status != loan.get('status'):
            loans_table.update_item(
                Key={'id': loan_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': new_status}
            )
            
    except ClientError as e:
        print(f"Error updating loan status: {e}")

@router.post("/", response_model=Repayment, status_code=status.HTTP_201_CREATED)
async def create_repayment(repayment: RepaymentCreate, current_user = Depends(auth_service.get_current_user)):
    # Verify loan exists and belongs to user
    try:
        loan_response = loans_table.get_item(Key={'id': repayment.loan_id})
        loan = loan_response.get('Item')
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if loan["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this loan")
        
        repayment_id = str(uuid.uuid4())
        repayment_data = {
            "id": repayment_id,
            "loan_id": repayment.loan_id,
            "user_id": current_user["id"],
            "amount": float(repayment.amount),
            "payment_date": repayment.payment_date.isoformat(),
            "notes": repayment.notes or "",
            "created_at": datetime.utcnow().isoformat()
        }
        
        repayments_table.put_item(Item=repayment_data)
        
        # Update loan status after adding repayment
        update_loan_status(repayment.loan_id)
        
        return repayment_data
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create repayment: {str(e)}"
        )

@router.get("/", response_model=List[Repayment])
async def get_all_repayments(current_user = Depends(auth_service.get_current_user)):
    """Get all repayments for the current user"""
    try:
        # Get all loans for the user first
        loans_response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': current_user["id"]}
        )
        
        user_loan_ids = [loan['id'] for loan in loans_response.get('Items', [])]
        
        # Get all repayments for the user's loans
        all_repayments = []
        for loan_id in user_loan_ids:
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan_id}
            )
            all_repayments.extend(repayments_response.get('Items', []))
        
        # Sort by payment date (most recent first)
        all_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
        
        return all_repayments
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repayments: {str(e)}"
        )

@router.get("/loan/{loan_id}", response_model=List[Repayment])
async def get_loan_repayments(loan_id: str, current_user = Depends(auth_service.get_current_user)):
    try:
        # Verify loan exists and belongs to user
        loan_response = loans_table.get_item(Key={'id': loan_id})
        loan = loan_response.get('Item')
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if loan["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this loan")
        
        repayments_response = repayments_table.query(
            IndexName='loan-id-index',
            KeyConditionExpression='loan_id = :loan_id',
            ExpressionAttributeValues={':loan_id': loan_id}
        )
        
        loan_repayments = repayments_response.get('Items', [])
        
        # Sort by payment date (most recent first)
        loan_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
        
        return loan_repayments
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch loan repayments: {str(e)}"
        )

@router.get("/summary", response_model=Summary)
async def get_summary(current_user = Depends(auth_service.get_current_user)):
    try:
        # Get all loans for the user
        loans_response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': current_user["id"]}
        )
        
        user_loans = loans_response.get('Items', [])
        
        # Get all repayments for the user's loans
        all_repayments = []
        for loan in user_loans:
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan['id']}
            )
            all_repayments.extend(repayments_response.get('Items', []))
        
        # Calculate summary values
        total_loans = len(user_loans)
        total_borrowed = sum(float(loan.get('amount', 0)) for loan in user_loans)
        total_repaid = sum(float(repayment.get('amount', 0)) for repayment in all_repayments)
        outstanding_amount = sum(float(loan.get('total_amount', 0)) for loan in user_loans) - total_repaid
        
        # Find the next payment due (simplified - in real app you'd calculate based on payment schedules)
        next_payment_due = None
        
        return {
            "total_loans": total_loans,
            "total_borrowed": total_borrowed,
            "total_repaid": total_repaid,
            "outstanding_amount": max(0, outstanding_amount),
            "next_payment_due": next_payment_due
        }
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch summary: {str(e)}"
        )
