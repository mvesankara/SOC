from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated # For Python 3.9+ style annotations with Depends

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated

from .. import crud_users, schemas, security, models # Use .. for relative imports
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter()

# OAuth2PasswordBearer scheme configuration
# tokenUrl should point to the login endpoint itself
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_active_user(token: Annotated[str, Depends(oauth2_scheme)]) -> models.User:
    """
    Dependency to get the current active user from a token.
    - Verifies JWT token.
    - Fetches user from DB.
    - Checks if user is active.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = security.verify_access_token(token, credentials_exception)
    if token_data.username is None: # Should be caught by verify_access_token, but defensive
        raise credentials_exception

    user = await crud_users.get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception # User in token not found in DB
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user


@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    Takes username and password from form data.
    """
    user = await crud_users.get_user_by_username(username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserRead)
async def read_users_me(
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Fetch the current logged-in user.
    """
    # The current_user is already a models.User instance thanks to the dependency.
    # Pydantic's from_attributes in schemas.UserRead will handle the conversion.
    return current_user


@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: schemas.UserCreate):
    """
    Create new user.
    """
    # Check if username already exists
    existing_user_by_username = await crud_users.get_user_by_username(username=user_in.username)
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered.",
        )

    # Check if email already exists (if email is provided)
    if user_in.email:
        existing_user_by_email = await crud_users.get_user_by_email(email=user_in.email)
        if existing_user_by_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered.",
            )

    user = await crud_users.create_user(user_data=user_in)
    return user

# We can add other auth-related endpoints here later, like /password-recovery etc.
