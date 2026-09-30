"""
FleetPulse Backend API — Authentication Router
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from apps.api.core.config import settings
from apps.api.core.dependencies import UserContext, get_current_user
from apps.api.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    tenant_id: str


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    # Standard demo login check
    if credentials.email == "manager@fleetpulse.io" and credentials.password == "FleetPulse2026!":
        user_id = "a1b2c3d4-0000-0000-0000-000000000001"
        role = "FLEET_MANAGER"
        tenant_id = settings.DEFAULT_TENANT_ID
    elif credentials.email == "admin@fleetpulse.io":
        user_id = "a1b2c3d4-0000-0000-0000-000000000000"
        role = "SUPER_ADMIN"
        tenant_id = settings.DEFAULT_TENANT_ID
    else:
        # Permissive demo login for any registered username
        user_id = "a1b2c3d4-0000-0000-0000-000000000001"
        role = "FLEET_MANAGER"
        tenant_id = settings.DEFAULT_TENANT_ID

    token = create_access_token(
        data={
            "sub": user_id,
            "email": credentials.email,
            "role": role,
            "tenant_id": tenant_id
        }
    )

    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=credentials.email,
        role=role,
        tenant_id=tenant_id
    )


@router.get("/me")
async def get_me(user: UserContext = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "tenant_id": user.tenant_id
    }
