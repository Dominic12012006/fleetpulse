"""
FleetPulse Backend API — Fleet & Vehicle Endpoints
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from apps.api.core.dependencies import UserContext, get_current_user
from apps.api.data.store import store
from packages.schemas.models import FleetSummaryDTO, RiskExplanation

router = APIRouter(prefix="", tags=["Fleet & Vehicles"])


@router.get("/fleet/summary", response_model=FleetSummaryDTO)
async def get_fleet_summary(user: UserContext = Depends(get_current_user)):
    return store.get_fleet_summary(tenant_id=user.tenant_id)


@router.get("/vehicles")
async def list_vehicles(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    status: Optional[str] = Query(None, description="ACTIVE, IN_SERVICE, GROUNDED"),
    query: Optional[str] = Query(None, description="Search by VIN, make, model, license plate"),
    user: UserContext = Depends(get_current_user)
):
    vehicles, total = store.get_vehicles(
        tenant_id=user.tenant_id,
        limit=limit,
        offset=offset,
        severity=severity,
        status_filter=status,
        query=query
    )
    return {
        "items": vehicles,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/vehicles/{vehicle_id}")
async def get_vehicle_detail(
    vehicle_id: str,
    user: UserContext = Depends(get_current_user)
):
    vehicle = store.get_vehicle_by_id(tenant_id=user.tenant_id, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found or access denied for tenant."
        )
    return vehicle


@router.get("/vehicles/{vehicle_id}/risk", response_model=RiskExplanation)
async def get_vehicle_risk_explanation(
    vehicle_id: str,
    user: UserContext = Depends(get_current_user)
):
    risk = store.get_vehicle_risk(tenant_id=user.tenant_id, vehicle_id=vehicle_id)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Risk profile for vehicle '{vehicle_id}' not available."
        )
    return risk


@router.get("/vehicles/{vehicle_id}/timeline")
async def get_vehicle_timeline(
    vehicle_id: str,
    points: int = Query(30, ge=5, le=100),
    user: UserContext = Depends(get_current_user)
):
    timeline = store.get_vehicle_timeline(tenant_id=user.tenant_id, vehicle_id=vehicle_id, points=points)
    return {"vehicle_id": vehicle_id, "timeline": timeline}
