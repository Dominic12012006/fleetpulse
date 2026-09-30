"""
FleetPulse — Canonical Telemetry Event Schema
Defines the strictly-typed canonical contract across simulator, ingestion, stream processor, and storage.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field, field_validator


class EventType(str, Enum):
    NORMAL = "NORMAL"
    HARSH_BRAKE = "HARSH_BRAKE"
    HARSH_ACCEL = "HARSH_ACCEL"
    OVERHEAT = "OVERHEAT"
    DTC_TRIGGER = "DTC_TRIGGER"
    RAPID_DISCHARGE = "RAPID_DISCHARGE"
    BATTERY_CELL_IMBALANCE = "BATTERY_CELL_IMBALANCE"


class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VehicleStatus(str, Enum):
    ACTIVE = "ACTIVE"
    IN_SERVICE = "IN_SERVICE"
    GROUNDED = "GROUNDED"


class PropulsionType(str, Enum):
    ICE = "ICE"
    EV = "EV"
    HYBRID = "HYBRID"


class CanonicalTelemetryEvent(BaseModel):
    """
    Version 1.0.0 Canonical Telemetry Event.
    All incoming OEM payloads must normalize into this contract before reaching Kafka topic 'telemetry.canonical'.
    """
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Globally unique UUID4 idempotency key"
    )
    vehicle_id: str = Field(..., description="Stable internal vehicle UUID")
    vin: str = Field(..., min_length=17, max_length=17, description="17-character VIN")
    tenant_id: str = Field(..., description="Mandatory UUID for multi-tenant isolation")
    event_time: datetime = Field(..., description="Vehicle sensor observation timestamp")
    ingest_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Ingestion gateway receipt timestamp"
    )
    sequence_no: int = Field(default=0, ge=0, description="Vehicle telemetry sequence counter")
    oem: str = Field(..., description="Source OEM identifier (OEM_A, OEM_B, OEM_C)")
    schema_version: str = Field(default="1.0.0", description="Contract schema version")

    # Kinematic & Spatial
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    speed_kmh: float = Field(..., ge=0.0, le=300.0, description="Vehicle speed in km/h")
    heading_deg: Optional[float] = Field(default=0.0, ge=0.0, le=360.0, description="Compass heading 0-360")
    odometer_km: float = Field(..., ge=0.0, description="Cumulative odometer reading")

    # Powertrain & Diagnostics
    propulsion_type: PropulsionType = Field(default=PropulsionType.ICE)
    engine_temp_c: Optional[float] = Field(default=None, ge=-40.0, le=200.0, description="Engine coolant temperature (ICE/Hybrid)")
    battery_temp_c: Optional[float] = Field(default=None, ge=-40.0, le=100.0, description="Battery pack temperature (EV/Hybrid)")
    soc_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="State of charge 0-100% (EV/Hybrid)")
    fuel_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Fuel level 0-100% (ICE/Hybrid)")
    oil_pressure_kpa: Optional[float] = Field(default=None, ge=0.0, le=1000.0)
    battery_voltage: Optional[float] = Field(default=None, ge=0.0, le=1000.0)

    # Diagnostic Trouble Codes & Event Classification
    dtc_codes: List[str] = Field(default_factory=list, description="Active OBD-II/UDS diagnostic trouble codes")
    event_type: EventType = Field(default=EventType.NORMAL, description="Event classification")
    is_anomaly: bool = Field(default=False, description="Flag indicating simulated or detected anomaly")

    # Observability & Timestamp Tracing
    processing_time: Optional[datetime] = Field(default=None, description="Stream processing timestamp")
    persistence_time: Optional[datetime] = Field(default=None, description="Storage commit timestamp")
    publish_time: Optional[datetime] = Field(default=None, description="WebSocket broadcast timestamp")

    @field_validator("vin")
    @classmethod
    def validate_vin(cls, v: str) -> str:
        v_upper = v.upper()
        if len(v_upper) != 17:
            raise ValueError(f"VIN must be exactly 17 characters, got {len(v_upper)}")
        # Check standard forbidden VIN characters I, O, Q
        for char in ("I", "O", "Q"):
            if char in v_upper:
                raise ValueError(f"VIN cannot contain illegal character '{char}'")
        return v_upper
