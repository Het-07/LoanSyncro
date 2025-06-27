import boto3
from botocore.exceptions import ClientError
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, jwk
from jose.utils import base64url_decode
from typing import Optional
from ..models.user import User
import requests
import json
from datetime import datetime

# OAuth2 scheme for FastAPI to expect a Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login") # Token URL is now symbolic, as login is via Cognito

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
users_table = dynamodb.Table(os.getenv('DYNAMODB_USERS_TABLE', 'loansyncro-users-dev'))

# Cognito Identity Provider client for updating user attributes
cognito_idp_client = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1'))

# Ensure COGNITO_USER_POOL_ID, COGNITO_USER_POOL_CLIENT_ID, and AWS_REGION are available as environment variables
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
COGNITO_USER_POOL_CLIENT_ID = os.getenv('COGNITO_USER_POOL_CLIENT_ID')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Validate required environment variables
if not COGNITO_USER_POOL_ID:
  print("ERROR: COGNITO_USER_POOL_ID environment variable is not set. Cognito JWT validation and custom attribute update will fail.")
if not COGNITO_USER_POOL_CLIENT_ID:
  print("ERROR: COGNITO_USER_POOL_CLIENT_ID environment variable is not set. Cognito JWT validation will fail.")
if not AWS_REGION:
  print("ERROR: AWS_REGION environment variable is not set. Cognito JWT validation will fail.")

# Fetch JWKS (JSON Web Key Set) from Cognito User Pool
# In a production environment, this should be cached and refreshed periodically
JWKS_URL = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
JWKS = None

def get_jwks():
  """Fetches and caches the JSON Web Key Set from Cognito."""
  global JWKS
  if JWKS is None:
      if not COGNITO_USER_POOL_ID or not AWS_REGION:
          raise HTTPException(
              status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
              detail="Cognito User Pool ID or AWS Region not configured for JWKS."
          )
      try:
          response = requests.get(JWKS_URL)
          response.raise_for_status() # Raise an exception for HTTP errors
          JWKS = response.json()
          print(f"Successfully fetched JWKS from {JWKS_URL}")
      except requests.exceptions.RequestException as e:
          print(f"Error fetching JWKS from {JWKS_URL}: {e}")
          raise HTTPException(
              status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
              detail="Failed to retrieve Cognito public keys for token validation."
          )
  return JWKS

def get_user_profile_from_dynamodb(user_id: str):
  """Get user profile from DynamoDB by ID (Cognito 'sub')."""
  try:
      response = users_table.get_item(Key={'id': user_id})
      return response.get('Item')
  except ClientError as e:
      print(f"Error getting user profile from DynamoDB: {e}")
      return None

def create_user_profile_in_dynamodb(user_id: str, email: str, full_name: str):
  """
  Creates or updates a user profile in DynamoDB.
  This function is called AFTER a user has successfully registered and confirmed in Cognito.
  It does NOT handle password hashing or primary user registration.
  """
  try:
      user_data = {
          "id": user_id,
          "email": email,
          "full_name": full_name,
          "created_at": datetime.utcnow().isoformat(),
          # Add any other default profile data here
      }
      users_table.put_item(Item=user_data)
      print(f"Successfully created/updated user profile {user_id} in DynamoDB.")

      # Optionally, update Cognito custom attribute if needed (e.g., to mark user as initialized)
      if COGNITO_USER_POOL_ID:
          try:
              cognito_idp_client.admin_update_user_attributes(
                  UserPoolId=COGNITO_USER_POOL_ID,
                  Username=email, # Cognito username is email in our setup
                  UserAttributes=[
                      {
                          'Name': 'custom:isInitialized',
                          'Value': 'true'
                      },
                  ]
              )
              print(f"Successfully set custom:isInitialized for user {email} in Cognito.")
          except ClientError as e:
              print(f"Warning: Could not set custom:isInitialized for user {email} in Cognito: {e}")
          except Exception as e:
              print(f"Unexpected error setting custom:isInitialized for user {email}: {e}")
      else:
          print("Skipping custom:isInitialized update: COGNITO_USER_POOL_ID is not set.")

      return user_data
  except ClientError as e:
      print(f"Error creating/updating user profile in DynamoDB: {e}")
      return None
  except Exception as e:
      print(f"Unexpected error in create_user_profile_in_dynamodb: {e}")
      return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
  """
  Validates a Cognito-issued JWT and returns the current user.
  This function now correctly validates tokens signed by AWS Cognito.
  """
  credentials_exception = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
  )

  if not COGNITO_USER_POOL_ID or not COGNITO_USER_POOL_CLIENT_ID or not AWS_REGION:
      print("ERROR: Missing Cognito environment variables. Cannot validate Cognito JWTs.")
      raise credentials_exception

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
      # The `jose` library's `decode` function can verify signature and claims in one go
      payload = jwt.decode(
          token,
          key.to_dict(), # Pass the public key dictionary
          algorithms=[alg], # Use the algorithm from the token header
          audience=COGNITO_USER_POOL_CLIENT_ID, # Validate against your Cognito User Pool Client ID
          issuer=f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}" # Validate against your User Pool Issuer
      )

      # Extract user ID (sub) and email from the payload
      user_id: str = payload.get("sub")
      email: str = payload.get("email")
      full_name: str = payload.get("name", "") # Cognito 'name' attribute

      if user_id is None or email is None:
          print(f"JWT payload missing 'sub' or 'email'. Payload: {payload}")
          raise credentials_exception
      
      # Ensure the user profile exists in DynamoDB. If not, create it.
      user_profile = get_user_profile_from_dynamodb(user_id)
      if not user_profile:
          print(f"User profile for {user_id} not found in DynamoDB. Creating...")
          user_profile = create_user_profile_in_dynamodb(user_id, email, full_name)
          if not user_profile:
              raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user profile in DynamoDB.")

      # Return a User object based on the DynamoDB profile
      return User(
          id=user_profile["id"],
          email=user_profile["email"],
          full_name=user_profile["full_name"],
          created_at=user_profile["created_at"]
      )

  except (jwt.JWTError, ValueError, requests.exceptions.RequestException) as e:
      print(f"JWT validation failed: {e}")
      raise credentials_exception
  except ClientError as e:
      print(f"DynamoDB error during user lookup: {e}")
      raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user lookup.")
  except Exception as e:
      print(f"An unexpected error occurred during token validation: {e}")
      raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected server error occurred.")
