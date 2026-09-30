"""
FleetPulse Backend API — Alerts & Risk Queue Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from apps.api.core.dependencies import UserContext, get_current_user, require_role
from apps.api.data.store import store

router = APIRouter(prefix="/alerts", tags=["Alerts & Risk Queue"])


@router.get("")
async def list_alerts(
    status: str | None = Query(None, description="OPEN, ACKNOWLEDGED, RESOLVED"),
    severity: str | None = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: UserContext = Depends(get_current_user)
):
    alerts, total = store.get_alerts(
        tenant_id=user.tenant_id,
        status_filter=status,
        severity_filter=severity,
        limit=limit,
        offset=offset
    )
    return {
        "items": [a.model_dump(mode="json") for a in alerts],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.post("/{alert_id}/ack")
async def acknowledge_alert(
    alert_id: str,
    user: UserContext = Depends(require_role(["FLEET_MANAGER", "SUPER_ADMIN"]))
):
    alert = store.acknowledge_alert(
        tenant_id=user.tenant_id,
        alert_id=alert_id,
        user_id=user.user_id
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found or already resolved."
        )
    return {
        "status": "success",
        "alert": alert.model_dump(mode="json"),
        "message": f"Alert acknowledged by {user.email}"
    }
