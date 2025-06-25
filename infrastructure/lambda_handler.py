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
    """Handle user registration with Cognito"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        cognito = boto3.client('cognito-idp')
        
        # Create user in Cognito
        response = cognito.admin_create_user(
            UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
            Username=body['email'],
            UserAttributes=[
                {'Name': 'email', 'Value': body['email']},
                {'Name': 'name', 'Value': body['full_name']},
                {'Name': 'email_verified', 'Value': 'true'}
            ],
            TemporaryPassword=body['password'],
            MessageAction='SUPPRESS'
        )
        
        # Set permanent password
        cognito.admin_set_user_password(
            UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
            Username=body['email'],
            Password=body['password'],
            Permanent=True
        )
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'message': 'User registered successfully',
                'user_id': response['User']['Username']
            })
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def handle_login(event, headers):
    """Handle user login"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        cognito = boto3.client('cognito-idp')
        
        response = cognito.admin_initiate_auth(
            UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
            ClientId=os.environ['COGNITO_USER_POOL_CLIENT_ID'],
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={
                'USERNAME': body['email'],
                'PASSWORD': body['password']
            }
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'access_token': response['AuthenticationResult']['AccessToken'],
                'id_token': response['AuthenticationResult']['IdToken'],
                'refresh_token': response['AuthenticationResult']['RefreshToken']
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
        cognito = boto3.client('cognito-idp')
        response = cognito.get_user(AccessToken=token)
        
        user_attrs = {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'user': {
                    'id': user_attrs.get('sub'),
                    'email': user_attrs.get('email'),
                    'full_name': user_attrs.get('name'),
                    'created_at': datetime.utcnow().isoformat()
                }
            })
        }
    except Exception as e:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid token'})
        }

# Copy the same pattern for loans_handler and repayments_handler
def loans_handler(event, context):
    """Loans handler - similar structure"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'Loans service is running',
            'timestamp': datetime.utcnow().isoformat()
        })
    }

def repayments_handler(event, context):
    """Repayments handler - similar structure"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'Repayments service is running',
            'timestamp': datetime.utcnow().isoformat()
        })
    }