import boto3
from botocore.exceptions import ClientError
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from ..models.user import TokenData, User
import hashlib

# These would come from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "temporary_secret_key_for_local_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
users_table = dynamodb.Table(os.getenv('DYNAMODB_USERS_TABLE', 'loansyncro-users-dev'))

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

def get_user(email: str):
    """Get user from DynamoDB"""
    try:
        response = users_table.get_item(
            Key={'email': email},
            IndexName='email-index'
        )
        return response.get('Item')
    except ClientError as e:
        print(f"Error getting user: {e}")
        return None

def create_user(user_data: dict):
    """Create user in DynamoDB"""
    try:
        # Hash the password before storing
        user_data['password'] = hash_password(user_data['password'])
        users_table.put_item(Item=user_data)
        return user_data
    except ClientError as e:
        print(f"Error creating user: {e}")
        return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user["password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user(token_data.email)
    if user is None:
        raise credentials_exception
    return user
