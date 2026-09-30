"""
FleetPulse Backend API — Audit Logs Router
"""


from fastapi import APIRouter, Depends, Query

from apps.api.core.dependencies import UserContext, require_role
from apps.api.data.store import store
from packages.schemas.models import AuditLogDTO

router = APIRouter(prefix="/audit", tags=["Security & Audit"])


@router.get("", response_model=list[AuditLogDTO])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    user: UserContext = Depends(require_role(["FLEET_MANAGER", "SUPER_ADMIN", "AUDITOR"]))
):
    logs = store.get_audit_logs(tenant_id=user.tenant_id, limit=limit)
    return logs
