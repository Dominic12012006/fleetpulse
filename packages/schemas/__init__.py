"""
FleetPulse Schemas Package
"""

from packages.schemas.events import (
    CanonicalTelemetryEvent,
    EventType,
    SeverityLevel,
    VehicleStatus,
    PropulsionType,
)
from packages.schemas.oem import (
    OEMA_Payload,
    OEMB_Payload,
    OEMC_Payload,
    normalize_oem_payload,
)
from packages.schemas.models import (
    ActionType,
    ActionStatus,
    ActionPriority,
    ContributingFactor,
    RiskExplanation,
    AlertDTO,
    VehicleSummaryDTO,
    FleetSummaryDTO,
    MaintenanceActionCreateRequest,
    MaintenanceActionDTO,
    AuditLogDTO,
)

__all__ = [
    "CanonicalTelemetryEvent",
    "EventType",
    "SeverityLevel",
    "VehicleStatus",
    "PropulsionType",
    "OEMA_Payload",
    "OEMB_Payload",
    "OEMC_Payload",
    "normalize_oem_payload",
    "ActionType",
    "ActionStatus",
    "ActionPriority",
    "ContributingFactor",
    "RiskExplanation",
    "AlertDTO",
    "VehicleSummaryDTO",
    "FleetSummaryDTO",
    "MaintenanceActionCreateRequest",
    "MaintenanceActionDTO",
    "AuditLogDTO",
]
