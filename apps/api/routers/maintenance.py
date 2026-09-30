"""
FleetPulse Backend API — Maintenance Work Orders Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from apps.api.core.dependencies import UserContext, get_current_user, require_role
from apps.api.data.store import store
from packages.schemas.models import (
    MaintenanceActionCreateRequest,
    MaintenanceActionDTO,
)

router = APIRouter(prefix="/maintenance-actions", tags=["Maintenance & Dispatch"])


@router.post("", response_model=MaintenanceActionDTO)
async def create_maintenance_action(
    req: MaintenanceActionCreateRequest,
    user: UserContext = Depends(require_role(["FLEET_MANAGER", "SUPER_ADMIN"]))
):
    action = store.create_maintenance_action(
        tenant_id=user.tenant_id,
        req=req,
        user_id=user.user_id
    )
    return action


@router.get("", response_model=List[MaintenanceActionDTO])
async def list_maintenance_actions(
    status: Optional[str] = Query(None, description="SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED"),
    user: UserContext = Depends(get_current_user)
):
    actions = store.get_maintenance_actions(
        tenant_id=user.tenant_id,
        status_filter=status
    )
    return actions
