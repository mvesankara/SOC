from passlib.context import CryptContext

# Initialize CryptContext for password hashing
# Using bcrypt as the default hashing algorithm
# "deprecated="auto"" will automatically upgrade hashes if schemes change in the future
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a plain password.
    """
    return pwd_context.hash(password)

# --- JWT Token Handling ---
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from . import schemas # For TokenData schema

# This oauth2_scheme will be used in the API endpoints for dependency injection
# It defines that the token should be sent as a Bearer token in the Authorization header.
# The tokenUrl should point to your login endpoint. We'll define it later when creating the auth router.
# For now, we can put a placeholder or define it when we create the auth router.
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # Placeholder, actual tokenUrl will be like /api/v1/auth/token

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a new JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str, credentials_exception: HTTPException) -> Optional[schemas.TokenData]:
    """
    Verifies the access token.
    If valid, returns the token data (payload).
    If invalid, raises the provided credentials_exception.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub") # Assuming 'sub' (subject) is the username
        if username is None:
            raise credentials_exception
        # You could add more validation here, e.g., check token scope if you implement scopes.
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

# Example usage for get_current_user dependency (will be refined in the auth router step)
# async def get_current_user_placeholder(token: str = Depends(oauth2_scheme)):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     return verify_access_token(token, credentials_exception)
