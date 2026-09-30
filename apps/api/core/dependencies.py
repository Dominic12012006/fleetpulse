"""
FleetPulse Backend API — FastAPI Dependencies & RBAC Enforcement
"""

from typing import List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from apps.api.core.config import settings
from apps.api.core.security import decode_access_token

security = HTTPBearer(auto_error=False)


class UserContext:
    def __init__(self, user_id: str, email: str, role: str, tenant_id: str):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.tenant_id = tenant_id


# Mock / Seed user store for fast in-memory or fallback resolution
DEFAULT_MANAGER = UserContext(
    user_id="a1b2c3d4-0000-0000-0000-000000000001",
    email="manager@fleetpulse.io",
    role="FLEET_MANAGER",
    tenant_id=settings.DEFAULT_TENANT_ID
)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> UserContext:
    """
    Validates JWT token and returns authenticated UserContext.
    In local development / demo mode, defaults to seeded Fleet Manager if no bearer token is passed.
    """
    if not credentials:
        # Fallback to default fleet manager for seamless demo usage
        return DEFAULT_MANAGER

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    email = payload.get("email", "unknown@fleetpulse.io")
    role = payload.get("role", "FLEET_MANAGER")
    tenant_id = payload.get("tenant_id", settings.DEFAULT_TENANT_ID)

    if not user_id or not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims",
        )

    return UserContext(user_id=user_id, email=email, role=role, tenant_id=tenant_id)


def require_role(allowed_roles: List[str]):
    """Enforces Role-Based Access Control (RBAC)."""
    async def role_checker(current_user: UserContext = Depends(get_current_user)) -> UserContext:
        if current_user.role not in allowed_roles and current_user.role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' lacks permission for this action. Required: {allowed_roles}"
            )
        return current_user
    return role_checker
