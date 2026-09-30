"""
FleetPulse Schemas Package
"""

from packages.schemas.events import (
    CanonicalTelemetryEvent,
    EventType,
    PropulsionType,
    SeverityLevel,
    VehicleStatus,
)
from packages.schemas.models import (
    ActionPriority,
    ActionStatus,
    ActionType,
    AlertDTO,
    AuditLogDTO,
    ContributingFactor,
    FleetSummaryDTO,
    MaintenanceActionCreateRequest,
    MaintenanceActionDTO,
    RiskExplanation,
    VehicleSummaryDTO,
)
from packages.schemas.oem import (
    OEMA_Payload,
    OEMB_Payload,
    OEMC_Payload,
    normalize_oem_payload,
)

__all__ = [
    "ActionPriority",
    "ActionStatus",
    "ActionType",
    "AlertDTO",
    "AuditLogDTO",
    "CanonicalTelemetryEvent",
    "ContributingFactor",
    "EventType",
    "FleetSummaryDTO",
    "MaintenanceActionCreateRequest",
    "MaintenanceActionDTO",
    "OEMA_Payload",
    "OEMB_Payload",
    "OEMC_Payload",
    "PropulsionType",
    "RiskExplanation",
    "SeverityLevel",
    "VehicleStatus",
    "VehicleSummaryDTO",
    "normalize_oem_payload",
]
