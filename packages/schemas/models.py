"""
FleetPulse — Domain & API Data Transfer Objects (DTOs)
Covers Alerts, Vehicles, Maintenance Actions, Risk Explanations, and Audit Logs.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from packages.schemas.events import PropulsionType, SeverityLevel, VehicleStatus


class ActionType(str, Enum):
    INSPECTION = "INSPECTION"
    OIL_CHANGE = "OIL_CHANGE"
    BRAKE_SERVICE = "BRAKE_SERVICE"
    BATTERY_REPLACEMENT = "BATTERY_REPLACEMENT"
    THERMAL_SYSTEM_REPAIR = "THERMAL_SYSTEM_REPAIR"
    ROUTINE_SERVICE = "ROUTINE_SERVICE"


class ActionStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ActionPriority(str, Enum):
    ROUTINE = "ROUTINE"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"


class ContributingFactor(BaseModel):
    factor: str
    weight: float
    detail: str | None = None
    value: str | None = None
    threshold: str | None = None


class RiskExplanation(BaseModel):
    priority_score: float = Field(..., ge=0.0, le=100.0, description="Composite score: P x I x U normalized to 0-100")
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Model/Baseline failure probability")
    impact_exposure: float = Field(..., ge=1.0, le=10.0, description="Operational & business exposure factor")
    urgency_factor: float = Field(..., ge=1.0, le=5.0, description="Physics rate-of-change / urgency factor")
    severity: SeverityLevel
    model_version: str = "v1.0-baseline"
    contributing_factors: list[ContributingFactor] = Field(default_factory=list)
    recommended_action: str | None = None


class AlertDTO(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    vehicle_id: str
    vin: str | None = None
    alert_type: str
    severity: SeverityLevel
    priority_score: float
    risk_probability: float
    impact_exposure: float
    urgency_factor: float
    contributing_factors: list[ContributingFactor] = Field(default_factory=list)
    dtc_codes: list[str] = Field(default_factory=list)
    status: str = "OPEN"  # OPEN, ACKNOWLEDGED, RESOLVED
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None
    event_time: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VehicleSummaryDTO(BaseModel):
    id: str
    tenant_id: str
    fleet_id: str | None = None
    vin: str
    license_plate: str
    make: str
    model: str
    year: int
    propulsion_type: PropulsionType
    odometer_km: float
    status: VehicleStatus
    current_risk_score: float
    current_severity: SeverityLevel
    active_dtcs: list[str] = Field(default_factory=list)
    lat: float
    lon: float
    speed_kmh: float
    soc_pct: float | None = None
    engine_temp_c: float | None = None
    last_telemetry_at: datetime | None = None


class FleetSummaryDTO(BaseModel):
    tenant_id: str
    total_vehicles: int
    active_vehicles: int
    high_risk_vehicles: int
    critical_alerts_count: int
    avg_fleet_risk_score: float
    events_per_sec: float
    ingestion_latency_ms: float
    system_health_pct: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MaintenanceActionCreateRequest(BaseModel):
    vehicle_id: str
    alert_id: str | None = None
    action_type: ActionType
    priority: ActionPriority = ActionPriority.ROUTINE
    notes: str | None = None
    scheduled_for: datetime


class MaintenanceActionDTO(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    vehicle_id: str
    alert_id: str | None = None
    scheduled_by: str | None = None
    action_type: ActionType
    status: ActionStatus = ActionStatus.SCHEDULED
    priority: ActionPriority
    notes: str | None = None
    scheduled_for: datetime
    completed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLogDTO(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    user_id: str | None = None
    action: str
    entity_type: str
    entity_id: str
    details: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
