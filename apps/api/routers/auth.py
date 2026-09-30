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
    role: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    tenant_id: str


ROLE_NAMES = {
    "SUPER_ADMIN": "Alex Mercer (Super Admin)",
    "FLEET_MANAGER": "Dominic Vance (Fleet Operations)",
    "DISPATCHER": "Elena Rostova (Lead Dispatcher)",
    "SAFETY_OFFICER": "Marcus Chen (Safety & Compliance)",
    "TECHNICIAN": "David Miller (Diagnostic Specialist)"
}


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    # Map personas by email or explicit role override
    if credentials.role and credentials.role in ROLE_NAMES:
        role = credentials.role
    elif "admin" in credentials.email.lower():
        role = "SUPER_ADMIN"
    elif "dispatch" in credentials.email.lower():
        role = "DISPATCHER"
    elif "safety" in credentials.email.lower():
        role = "SAFETY_OFFICER"
    elif "tech" in credentials.email.lower():
        role = "TECHNICIAN"
    else:
        role = "FLEET_MANAGER"

    user_id = f"user-{role.lower().replace('_', '-')}-01"
    name = ROLE_NAMES.get(role, "Fleet Operator")
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
        name=name,
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
