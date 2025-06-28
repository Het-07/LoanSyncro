import json
import boto3
import os
import uuid
from datetime import datetime

def loans_handler(event, context):
    """Loans handler with full CRUD operations"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
    }
    
    try:
        if event.get('httpMethod') == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': ''}
        
        # Get user info from Cognito authorizer
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('user_id') or claims.get('sub')
        if not user_id:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'User ID not found in token'})
            }
        
        dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        loans_table = dynamodb.Table(os.environ.get('DYNAMODB_LOANS_TABLE', 'loansyncro-dev-loans'))
        
        path = event.get('path', '').split('/')
        method = event.get('httpMethod', '')
        
        if method == 'POST' and path[-1] == 'loans':
            body = json.loads(event.get('body', '{}'))
            
            principal = float(body.get('amount', 0))
            rate = float(body.get('interest_rate', 0)) / 100 / 12
            term = int(body.get('term_months', 0))
            
            if rate > 0:
                monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
            else:
                monthly_payment = principal / term
            
            total_amount = monthly_payment * term
            
            loan_data = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'title': body.get('title'),
                'amount': principal,
                'interest_rate': float(body.get('interest_rate', 0)),
                'term_months': term,
                'start_date': body.get('start_date', datetime.utcnow().isoformat()),
                'description': body.get('description', ''),
                'created_at': datetime.utcnow().isoformat(),
                'total_amount': float(total_amount),
                'monthly_payment': float(monthly_payment),
                'status': 'active'
            }
            
            loans_table.put_item(Item=loan_data)
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(loan_data)
            }
        
        elif method == 'GET' and path[-1] == 'loans':
            response = loans_table.query(
                IndexName='user-id-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response.get('Items', []))
            }
        
        elif method == 'GET' and path[-2] == 'loans':
            loan_id = path[-1]
            response = loans_table.get_item(Key={'id': loan_id})
            loan = response.get('Item')
            
            if not loan:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Loan not found'})
                }
            
            if loan['user_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not authorized to access this loan'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(loan)
            }
        
        elif method == 'PUT' and path[-2] == 'loans':
            loan_id = path[-1]
            body = json.loads(event.get('body', '{}'))
            
            response = loans_table.get_item(Key={'id': loan_id})
            loan = response.get('Item')
            
            if not loan:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Loan not found'})
                }
            
            if loan['user_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not authorized to update this loan'})
                }
            
            principal = float(body.get('amount', loan['amount']))
            rate = float(body.get('interest_rate', loan['interest_rate'])) / 100 / 12
            term = int(body.get('term_months', loan['term_months']))
            
            if rate > 0:
                monthly_payment = principal * rate * (1 + rate)**term / ((1 + rate)**term - 1)
            else:
                monthly_payment = principal / term
            
            total_amount = monthly_payment * term
            
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
                    ':title': body.get('title', loan['title']),
                    ':amount': principal,
                    ':interest_rate': float(body.get('interest_rate', loan['interest_rate'])),
                    ':term_months': term,
                    ':start_date': body.get('start_date', loan['start_date']),
                    ':description': body.get('description', loan['description']),
                    ':total_amount': float(total_amount),
                    ':monthly_payment': float(monthly_payment)
                }
            )
            
            response = loans_table.get_item(Key={'id': loan_id})
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response.get('Item'))
            }
        
        elif method == 'DELETE' and path[-2] == 'loans':
            loan_id = path[-1]
            response = loans_table.get_item(Key={'id': loan_id})
            loan = response.get('Item')
            
            if not loan:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Loan not found'})
                }
            
            if loan['user_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not authorized to delete this loan'})
                }
            
            loans_table.delete_item(Key={'id': loan_id})
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Loan deleted successfully'})
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid endpoint'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def repayments_handler(event, context):
    """Repayments handler with full CRUD operations"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
    }
    
    try:
        if event.get('httpMethod') == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': ''}
        
        # Get user info from Cognito authorizer
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('user_id') or claims.get('sub')
        if not user_id:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'User ID not found in token'})
            }
        
        dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        repayments_table = dynamodb.Table(os.environ.get('DYNAMODB_REPAYMENTS_TABLE', 'loansyncro-dev-repayments'))
        loans_table = dynamodb.Table(os.environ.get('DYNAMODB_LOANS_TABLE', 'loansyncro-dev-loans'))
        
        path = event.get('path', '').split('/')
        method = event.get('httpMethod', '')
        
        def update_loan_status(loan_id):
            """Update loan status based on total repayments"""
            loan_response = loans_table.get_item(Key={'id': loan_id})
            loan = loan_response.get('Item')
            
            if not loan:
                return
            
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan_id}
            )
            
            total_repaid = sum(
                float(repayment.get('amount', 0)) 
                for repayment in repayments_response.get('Items', [])
            )
            
            new_status = loan.get('status', 'active')
            if total_repaid >= float(loan.get('total_amount', 0)):
                new_status = 'paid'
            elif total_repaid > 0:
                new_status = 'active'
            
            if new_status != loan.get('status'):
                loans_table.update_item(
                    Key={'id': loan_id},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': new_status}
                )
        
        if method == 'POST' and path[-1] == 'repayments':
            body = json.loads(event.get('body', '{}'))
            
            loan_response = loans_table.get_item(Key={'id': body.get('loan_id')})
            loan = loan_response.get('Item')
            
            if not loan:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Loan not found'})
                }
            
            if loan['user_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not authorized to access this loan'})
                }
            
            repayment_id = str(uuid.uuid4())
            repayment_data = {
                'id': repayment_id,
                'loan_id': body.get('loan_id'),
                'user_id': user_id,
                'amount': float(body.get('amount')),
                'payment_date': body.get('payment_date', datetime.utcnow().isoformat()),
                'notes': body.get('notes', ''),
                'created_at': datetime.utcnow().isoformat()
            }
            
            repayments_table.put_item(Item=repayment_data)
            update_loan_status(body.get('loan_id'))
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(repayment_data)
            }
        
        elif method == 'GET' and path[-1] == 'repayments':
            loans_response = loans_table.query(
                IndexName='user-id-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            
            user_loan_ids = [loan['id'] for loan in loans_response.get('Items', [])]
            all_repayments = []
            
            for loan_id in user_loan_ids:
                repayments_response = repayments_table.query(
                    IndexName='loan-id-index',
                    KeyConditionExpression='loan_id = :loan_id',
                    ExpressionAttributeValues={':loan_id': loan_id}
                )
                all_repayments.extend(repayments_response.get('Items', []))
            
            all_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(all_repayments)
            }
        
        elif method == 'GET' and path[-2] == 'repayments' and path[-1] != 'summary':
            loan_id = path[-1]
            loan_response = loans_table.get_item(Key={'id': loan_id})
            loan = loan_response.get('Item')
            
            if not loan:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Loan not found'})
                }
            
            if loan['user_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not authorized to access this loan'})
                }
            
            repayments_response = repayments_table.query(
                IndexName='loan-id-index',
                KeyConditionExpression='loan_id = :loan_id',
                ExpressionAttributeValues={':loan_id': loan_id}
            )
            
            loan_repayments = repayments_response.get('Items', [])
            loan_repayments.sort(key=lambda x: x.get('payment_date', ''), reverse=True)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(loan_repayments)
            }
        
        elif method == 'GET' and path[-1] == 'summary':
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
            
            summary = {
                'total_loans': total_loans,
                'total_borrowed': total_borrowed,
                'total_repaid': total_repaid,
                'outstanding_amount': max(0, outstanding_amount),
                'next_payment_due': None
            }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(summary)
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid endpoint'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }