import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError
import uuid
import jwt
import time
from jose import jwk
import requests

# Global/Shared resources
AWS_REGION = os.environ['AWS_REGION']
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
sns_client = boto3.client('sns', region_name=AWS_REGION)

users_table = dynamodb.Table(os.environ['DYNAMODB_USERS_TABLE'])
loans_table = dynamodb.Table(os.environ['DYNAMODB_LOANS_TABLE'])
repayments_table = dynamodb.Table(os.environ['DYNAMODB_REPAYMENTS_TABLE'])

COGNITO_USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
COGNITO_USER_POOL_CLIENT_ID = os.environ['COGNITO_USER_POOL_CLIENT_ID']
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

JWKS = None
JWKS_URL = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

def publish_sns_notification(subject: str, message: str):
    """Publishes a notification to the SNS topic."""
    if not SNS_TOPIC_ARN:
        print("SNS_TOPIC_ARN not configured. Skipping notification.")
        return
    
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"SNS notification sent: {subject}")
    except Exception as e:
        print(f"Failed to send SNS notification: {e}")

def get_jwks():
    """Fetches and caches the JSON Web Key Set from Cognito."""
    global JWKS
    if JWKS is None:
        if not COGNITO_USER_POOL_ID or not AWS_REGION:
            raise Exception("Cognito User Pool ID or AWS Region not configured for JWKS.")
        try:
            response = requests.get(JWKS_URL)
            response.raise_for_status()
            JWKS = response.json()
            print(f"Successfully fetched JWKS from {JWKS_URL}")
        except requests.exceptions.RequestException as e:
            print(f"Error fetching JWKS from {JWKS_URL}: {e}")
            raise Exception("Failed to retrieve Cognito public keys for token validation.")
    return JWKS

def get_current_user_from_token(token: str):
    """Validates a Cognito-issued JWT and returns the current user's profile."""
    if not COGNITO_USER_POOL_ID or not COGNITO_USER_POOL_CLIENT_ID or not AWS_REGION:
        raise Exception("Missing Cognito environment variables. Cannot validate Cognito JWTs.")

    try:
        # 1. Decode the header to get the kid (key ID) and algorithm
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        alg = header.get('alg')

        if not kid or not alg:
            raise ValueError("Token header missing 'kid' or 'alg'.")

        # 2. Get JWKS and find the correct key
        jwks = get_jwks()
        key = None
        for jwk_key in jwks['keys']:
            if jwk_key.get('kid') == kid:
                key = jwk.construct(jwk_key)
                break
        
        if not key:
            raise ValueError(f"Public key with kid '{kid}' not found in JWKS.")

        # 3. Verify the token signature and claims
        payload = jwt.decode(
            token,
            key.to_dict(),
            algorithms=[alg],
            audience=COGNITO_USER_POOL_CLIENT_ID,
            issuer=f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        )

        # Extract user ID (sub) and email from the payload
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        full_name: str = payload.get("name", "")

        if user_id is None or email is None:
            print(f"JWT payload missing 'sub' or 'email'. Payload: {payload}")
            raise Exception("Invalid token payload.")
        
        # Ensure the user profile exists in DynamoDB
        user_profile = users_table.get_item(Key={'id': user_id}).get('Item')
        if not user_profile:
            print(f"User profile for {user_id} not found in DynamoDB. Creating...")
            user_profile = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "created_at": datetime.utcnow().isoformat(),
            }
            users_table.put_item(Item=user_profile)
            print(f"Successfully created user profile {user_id} in DynamoDB.")

        return user_profile

    except (jwt.JWTError, ValueError, requests.exceptions.RequestException) as e:
        print(f"JWT validation failed: {e}")
        raise Exception("Invalid authentication token.")
    except ClientError as e:
        print(f"DynamoDB error during user lookup: {e}")
        raise Exception("Database error during user lookup.")
    except Exception as e:
        print(f"An unexpected error occurred during token validation: {e}")
        raise Exception("An unexpected server error occurred during authentication.")

def get_api_response(status_code, body, headers):
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body)
    }

def get_cors_headers():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

# --- Loans Handler ---
def loans_handler(event, context):
    headers = get_cors_headers()
    
    if event.get('httpMethod') == 'OPTIONS':
        return get_api_response(200, '', headers)

    try:
        # Authenticate user for all loan operations
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return get_api_response(401, {'detail': 'Authorization token missing or invalid.'}, headers)
        token = auth_header.split(' ')[1]
        current_user = get_current_user_from_token(token)
        user_id = current_user['id']
        user_full_name = current_user.get('full_name', 'User')

        path = event.get('path', '')
        method = event.get('httpMethod', '')
        path_parts = [p for p in path.split('/') if p]

        # Handle /loans (GET all, POST create)
        if len(path_parts) == 1 and path_parts[0] == 'loans':
            if method == 'GET':
                return handle_get_all_loans(user_id, headers)
            elif method == 'POST':
                return handle_create_loan(event, user_id, user_full_name, headers)
        # Handle /loans/{loan_id} (GET by ID, PUT update, DELETE)
        elif len(path_parts) == 2 and path_parts[0] == 'loans':
            loan_id = path_parts[1]
            if method == 'GET':
                return handle_get_loan_by_id(loan_id, user_id, headers)
            elif method == 'PUT':
                return handle_update_loan(event, loan_id, user_id, headers)
            elif method == 'DELETE':
                return handle_delete_loan(loan_id, user_id, headers)
        
        return get_api_response(404, {'detail': 'Not Found'}, headers)

    except Exception as e:
        print(f"Loans handler error: {e}")
        status_code = 401 if "authentication" in str(e).lower() or "token" in str(e).lower() else 500
        return get_api_response(status_code, {'detail': str(e)}, headers)

# Helper functions for Loans
def handle_get_all_loans(user_id, headers):
    try:
        response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )
        return get_api_response(200, response.get('Items', []), headers)
    except ClientError as e:
        raise Exception(f"Failed to fetch loans: {str(e)}")

def handle_create_loan(event, user_id, user_full_name, headers):
    try:
        body = json.loads(event.get('body', '{}'))
        loan_id = str(uuid.uuid4())
        
        principal = body.get('amount', 0)
        interest_rate = body.get('interest_rate', 0)
        term_months = body.get('term_months', 0)

        # Basic validation
        if not all([body.get('title'), principal, interest_rate, term_months]):
            raise ValueError("Missing required loan fields.")
        if not isinstance(principal, (int, float)) or principal <= 0:
            raise ValueError("Amount must be a positive number.")
        if not isinstance(interest_rate, (int, float)) or interest_rate < 0:
            raise ValueError("Interest rate must be a non-negative number.")
        if not isinstance(term_months, int) or term_months <= 0:
            raise ValueError("Term months must be a positive integer.")
        
        # Calculate total amount and monthly payment
        rate = interest_rate / 100 / 12
        term = term_months
        
        if rate > 0:
            monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
        else:
            monthly_payment = principal / term
        
        total_amount = monthly_payment * term
        
        loan_data = {
            "id": loan_id,
            "user_id": user_id,
            "title": body.get('title'),
            "amount": float(principal),
            "interest_rate": float(interest_rate),
            "term_months": int(term_months),
            "start_date": body.get('start_date'),
            "description": body.get('description', ""),
            "created_at": datetime.utcnow().isoformat(),
            "total_amount": float(total_amount),
            "monthly_payment": float(monthly_payment),
            "status": "active"
        }
        
        loans_table.put_item(Item=loan_data)
        
        # Send SNS notification
        publish_sns_notification(
            subject="New Loan Created - LoanSyncro",
            message=f"Hello {user_full_name},\n\nA new loan has been created:\n\nTitle: {loan_data['title']}\nAmount: ${loan_data['amount']:,.2f}\nInterest Rate: {loan_data['interest_rate']}%\nTerm: {loan_data['term_months']} months\nMonthly Payment: ${loan_data['monthly_payment']:,.2f}\n\nLoan ID: {loan_id}\n\nBest regards,\nLoanSyncro Team"
        )
        
        return get_api_response(201, loan_data, headers)
    except ValueError as e:
        return get_api_response(400, {'detail': str(e)}, headers)
    except Exception as e:
        raise Exception(f"Failed to create loan: {str(e)}")

def handle_get_loan_by_id(loan_id, user_id, headers):
    try:
        response = loans_table.get_item(Key={'id': loan_id})
        loan = response.get('Item')
        
        if not loan:
            return get_api_response(404, {'detail': 'Loan not found'}, headers)
        
        if loan["user_id"] != user_id:
            return get_api_response(403, {'detail': 'Not authorized to access this loan'}, headers)
        
        return get_api_response(200, loan, headers)
    except ClientError as e:
        raise Exception(f"Failed to fetch loan: {str(e)}")

def handle_update_loan(event, loan_id, user_id, headers):
    try:
        body = json.loads(event.get('body', '{}'))
        
        response = loans_table.get_item(Key={'id': loan_id})
        existing_loan = response.get('Item')
        
        if not existing_loan:
            return get_api_response(404, {'detail': 'Loan not found'}, headers)
        
        if existing_loan["user_id"] != user_id:
            return get_api_response(403, {'detail': 'Not authorized to update this loan'}, headers)
        
        # Use existing values as defaults if not provided in update
        principal = body.get('amount', existing_loan['amount'])
        interest_rate = body.get('interest_rate', existing_loan['interest_rate'])
        term_months = body.get('term_months', existing_loan['term_months'])
        
        rate = interest_rate / 100 / 12
        if rate > 0:
            monthly_payment = principal * rate * (1 + rate)**term_months / ((1 + rate)**term_months - 1)
        else:
            monthly_payment = principal / term_months
        
        total_amount = monthly_payment * term_months
        
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
                ':title': body.get('title', existing_loan['title']),
                ':amount': float(principal),
                ':interest_rate': float(interest_rate),
                ':term_months': int(term_months),
                ':start_date': body.get('start_date', existing_loan['start_date']),
                ':description': body.get('description', existing_loan['description']),
                ':total_amount': float(total_amount),
                ':monthly_payment': float(monthly_payment)
            }
        )
        
        response = loans_table.get_item(Key={'id': loan_id})
        return get_api_response(200, response.get('Item'), headers)
        
    except ClientError as e:
        raise Exception(f"Failed to update loan: {str(e)}")

def handle_delete_loan(loan_id, user_id, headers):
    try:
        response = loans_table.get_item(Key={'id': loan_id})
        loan = response.get('Item')
        
        if not loan:
            return get_api_response(404, {'detail': 'Loan not found'}, headers)
        
        if loan["user_id"] != user_id:
            return get_api_response(403, {'detail': 'Not authorized to delete this loan'}, headers)
        
        loans_table.delete_item(Key={'id': loan_id})
        return get_api_response(200, {"message": "Loan deleted successfully"}, headers)
        
    except ClientError as e:
        raise Exception(f"Failed to delete loan: {str(e)}")

# --- Repayments Handler ---
def repayments_handler(event, context):
    headers = get_cors_headers()
    
    if event.get('httpMethod') == 'OPTIONS':
        return get_api_response(200, '', headers)

    try:
        # Authenticate user for all repayment operations
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return get_api_response(401, {'detail': 'Authorization token missing or invalid.'}, headers)
        token = auth_header.split(' ')[1]
        current_user = get_current_user_from_token(token)
        user_id = current_user['id']
        user_full_name = current_user.get('full_name', 'User')

        path = event.get('path', '')
        method = event.get('httpMethod', '')
        path_parts = [p for p in path.split('/') if p]

        # Handle /repayments (GET all, POST create)
        if len(path_parts) == 1 and path_parts[0] == 'repayments':
            if method == 'GET':
                return handle_get_all_repayments(user_id, headers)
            elif method == 'POST':
                return handle_create_repayment(event, user_id, user_full_name, headers)
        # Handle /repayments/summary (GET summary)
        elif len(path_parts) == 2 and path_parts[0] == 'repayments' and path_parts[1] == 'summary':
            if method == 'GET':
                return handle_get_summary(user_id, headers)
        # Handle /repayments/loan/{loan_id} (GET repayments for a specific loan)
        elif len(path_parts) == 3 and path_parts[0] == 'repayments' and path_parts[1] == 'loan':
            loan_id = path_parts[2]
            if method == 'GET':
                return handle_get_loan_repayments(loan_id, user_id, headers)
        
        return get_api_response(404, {'detail': 'Not Found'}, headers)

    except Exception as e:
        print(f"Repayments handler error: {e}")
        status_code = 401 if "authentication" in str(e).lower() or "token" in str(e).lower() else 500
        return get_api_response(status_code, {'detail': str(e)}, headers)

# Helper functions for Repayments
def update_loan_status(loan_id: str, user_full_name: str = "User"):
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
        old_status = loan.get('status', 'active')
        new_status = old_status
        if total_repaid >= float(loan.get('total_amount', 0)):
            new_status = 'paid'
        elif total_repaid > 0:
            new_status = 'active'
        
        # Update loan status if changed
        if new_status != old_status:
            loans_table.update_item(
                Key={'id': loan_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': new_status}
            )
            
            # Send SNS notification for status change
            if new_status == 'paid':
                publish_sns_notification(
                    subject="Loan Fully Paid - LoanSyncro",
                    message=f"Congratulations {user_full_name}!\n\nYour loan '{loan.get('title', 'Untitled')}' has been fully paid off!\n\nLoan Details:\n- Original Amount: ${loan.get('amount', 0):,.2f}\n- Total Paid: ${total_repaid:,.2f}\n- Loan ID: {loan_id}\n\nThank you for using LoanSyncro!\n\nBest regards,\nLoanSyncro Team"
                )
            
    except ClientError as e:
        print(f"Error updating loan status: {e}")

def handle_create_repayment(event, user_id, user_full_name, headers):
    try:
        body = json.loads(event.get('body', '{}'))
        loan_id = body.get('loan_id')

        # Basic validation
        if not all([loan_id, body.get('amount'), body.get('payment_date')]):
            raise ValueError("Missing required repayment fields.")
        if not isinstance(body.get('amount'), (int, float)) or body.get('amount') <= 0:
            raise ValueError("Amount must be a positive number.")

        loan_response = loans_table.get_item(Key={'id': loan_id})
        loan = loan_response.get('Item')
        
        if not loan:
            return get_api_response(404, {'detail': 'Loan not found'}, headers)
        
        if loan["user_id"] != user_id:
            return get_api_response(403, {'detail': 'Not authorized to access this loan'}, headers)
        
        repayment_id = str(uuid.uuid4())
        repayment_data = {
            "id": repayment_id,
            "loan_id": loan_id,
            "user_id": user_id,
            "amount": float(body.get('amount')),
            "payment_date": body.get('payment_date'), 
            "notes": body.get('notes', ""),
            "created_at": datetime.utcnow().isoformat()
        }
        
        repayments_table.put_item(Item=repayment_data)
        
        # Update loan status after adding repayment
        update_loan_status(loan_id, user_full_name)
        
        # Send SNS notification
        publish_sns_notification(
            subject="Repayment Recorded - LoanSyncro",
            message=f"Hello {user_full_name},\n\nA new repayment has been recorded:\n\nLoan: {loan.get('title', 'Untitled')}\nRepayment Amount: ${repayment_data['amount']:,.2f}\nPayment Date: {repayment_data['payment_date']}\nNotes: {repayment_data['notes']}\n\nRepayment ID: {repayment_id}\n\nBest regards,\nLoanSyncro Team"
        )
        
        return get_api_response(201, repayment_data, headers)
        
    except ValueError as e:
        return get_api_response(400, {'detail': str(e)}, headers)
    except Exception as e:
        raise Exception(f"Failed to create repayment: {str(e)}")

def handle_get_all_repayments(user_id, headers):
    try:
        loans_response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )
        
        user_loans = loans_response.get('Items', [])
        user_loan_ids = [loan['id'] for loan in user_loans]
        
        all_repayments = []
        for loan_id in user_loan_ids:
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan_id}
            )
            all_repayments.extend(repayments_response.get('Items', []))
        
        all_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
        
        return get_api_response(200, all_repayments, headers)
        
    except ClientError as e:
        raise Exception(f"Failed to fetch repayments: {str(e)}")

def handle_get_loan_repayments(loan_id, user_id, headers):
    try:
        loan_response = loans_table.get_item(Key={'id': loan_id})
        loan = loan_response.get('Item')
        
        if not loan:
            return get_api_response(404, {'detail': 'Loan not found'}, headers)
        
        if loan["user_id"] != user_id:
            return get_api_response(403, {'detail': 'Not authorized to access this loan'}, headers)
        
        repayments_response = repayments_table.query(
            IndexName='loan-id-index',
            KeyConditionExpression='loan_id = :loan_id',
            ExpressionAttributeValues={':loan_id': loan_id}
        )
        
        loan_repayments = repayments_response.get('Items', [])
        loan_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
        
        return get_api_response(200, loan_repayments, headers)
        
    except ClientError as e:
        raise Exception(f"Failed to fetch loan repayments: {str(e)}")

def handle_get_summary(user_id, headers):
    try:
        loans_response = loans_table.query(
            IndexName='user-id-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )
        
        user_loans = loans_response.get('Items', [])
        
        all_repayments = []
        for loan in user_loans:
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan['id']}
            )
            all_repayments.extend(repayments_response.get('Items', []))
        
        total_loans = len(user_loans)
        total_borrowed = sum(float(loan.get('amount', 0)) for loan in user_loans)
        total_repaid = sum(float(repayment.get('amount', 0)) for repayment in all_repayments)
        outstanding_amount = sum(float(loan.get('total_amount', 0)) for loan in user_loans) - total_repaid
        
        next_payment_due = None
        
        summary_data = {
            "total_loans": total_loans,
            "total_borrowed": total_borrowed,
            "total_repaid": total_repaid,
            "outstanding_amount": max(0, outstanding_amount),
            "next_payment_due": next_payment_due
        }
        
        return get_api_response(200, summary_data, headers)
        
    except ClientError as e:
        raise Exception(f"Failed to fetch summary: {str(e)}")
