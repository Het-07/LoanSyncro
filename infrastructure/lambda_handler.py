import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError

def auth_handler(event, context):
    """Enhanced auth handler with proper routing"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    try:
        if event.get('httpMethod') == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': ''}
        
        # Route based on path
        path = event.get('path', '').split('/')[-1]
        method = event.get('httpMethod', '')
        
        if path == 'register' and method == 'POST':
            return handle_register(event, headers)
        elif path == 'login' and method == 'POST':
            return handle_login(event, headers)
        elif path == 'verify' and method == 'GET':
            return handle_verify(event, headers)
        else:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Auth service is running',
                    'timestamp': datetime.utcnow().isoformat(),
                    'path': path,
                    'method': method
                })
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def handle_register(event, headers):
    """Handle user registration with DynamoDB"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # DynamoDB setup
        dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        users_table = dynamodb.Table(os.environ.get('DYNAMODB_USERS_TABLE', 'loansyncro-dev-users'))
        
        # Check if user already exists
        try:
            response = users_table.query(
                IndexName='email-index',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': body['email']}
            )
            if response['Items']:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email already registered'})
                }
        except Exception as e:
            print(f"Error checking existing user: {e}")
        
        # Create user
        import uuid
        import hashlib
        
        user_id = str(uuid.uuid4())
        hashed_password = hashlib.sha256(body['password'].encode()).hexdigest()
        
        user_data = {
            'id': user_id,
            'email': body['email'],
            'full_name': body['full_name'],
            'password': hashed_password,
            'created_at': datetime.utcnow().isoformat()
        }
        
        users_table.put_item(Item=user_data)
        
        # Remove password from response
        user_data.pop('password', None)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'message': 'User registered successfully',
                'user': user_data
            })
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def handle_login(event, headers):
    """Handle user login with DynamoDB"""
    try:
        # Parse form data
        body = event.get('body', '')
        if event.get('headers', {}).get('content-type') == 'application/x-www-form-urlencoded':
            from urllib.parse import parse_qs
            parsed_body = parse_qs(body)
            email = parsed_body.get('username', [''])[0]
            password = parsed_body.get('password', [''])[0]
        else:
            parsed_body = json.loads(body)
            email = parsed_body.get('email', '')
            password = parsed_body.get('password', '')
        
        # DynamoDB setup
        dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        users_table = dynamodb.Table(os.environ.get('DYNAMODB_USERS_TABLE', 'loansyncro-dev-users'))
        
        # Get user
        response = users_table.query(
            IndexName='email-index',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        
        if not response['Items']:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        user = response['Items'][0]
        
        # Verify password
        import hashlib
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        if user['password'] != hashed_password:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        # Create JWT token (simplified)
        import jwt
        import time
        
        payload = {
            'sub': user['email'],
            'user_id': user['id'],
            'exp': int(time.time()) + 3600  # 1 hour
        }
        
        secret_key = os.environ.get('SECRET_KEY', 'temporary_secret_key_for_local_development')
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'access_token': token,
                'token_type': 'bearer'
            })
        }
    except Exception as e:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid credentials'})
        }

def handle_verify(event, headers):
    """Handle token verification"""
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            raise ValueError('Invalid authorization header')
        
        token = auth_header.split(' ')[1]
        
        # Verify JWT token
        import jwt
        secret_key = os.environ.get('SECRET_KEY', 'temporary_secret_key_for_local_development')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        
        # Get user from DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        users_table = dynamodb.Table(os.environ.get('DYNAMODB_USERS_TABLE', 'loansyncro-dev-users'))
        
        response = users_table.query(
            IndexName='email-index',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': payload['sub']}
        )
        
        if not response['Items']:
            raise ValueError('User not found')
        
        user = response['Items'][0]
        user.pop('password', None)  # Remove password from response
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'user': user})
        }
    except Exception as e:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid token'})
        }

def loans_handler(event, context):
    """Loans handler"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'Loans service is running',
            'timestamp': datetime.utcnow().isoformat()
        })
    }

def repayments_handler(event, context):
    """Repayments handler"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'Repayments service is running',
            'timestamp': datetime.utcnow().isoformat()
        })
    }
