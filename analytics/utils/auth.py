import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Verify JWT token and return payload
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Remove "Bearer " prefix if present
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=["HS256"]
        )
        
        # Check token expiration
        if payload.get("exp", 0) < jwt.time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Validate required fields
        user_id = payload.get("userId")
        email = payload.get("email")
        role = payload.get("role")
        
        if not all([user_id, email, role]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "role": role
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_admin(current_user: dict = Depends(verify_token)) -> dict:
    """
    Require admin role
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def require_operator_or_admin(current_user: dict = Depends(verify_token)) -> dict:
    """
    Require operator or admin role
    """
    role = current_user.get("role")
    if role not in ["admin", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator or admin access required"
        )
    return current_user
