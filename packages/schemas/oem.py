"""
FleetPulse — Multi-OEM Raw Payload Schemas and Normalizers
Supports heterogeneous telemetry feeds (OEM_A, OEM_B, OEM_C) into CanonicalTelemetryEvent.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from packages.schemas.events import CanonicalTelemetryEvent, EventType, PropulsionType


class OEMA_Payload(BaseModel):
    """
    OEM_A: European automotive supplier spec (nested structures, epoch seconds, separate diagnostics).
    """
    vehicle_ident: str = Field(..., description="17-char VIN")
    tenant_code: str
    telemetry_epoch: float = Field(..., description="UNIX epoch in seconds")
    gps: dict[str, float] = Field(..., description="{'latitude': float, 'longitude': float, 'speed_kph': float, 'heading': float}")
    sensors: dict[str, Any] = Field(..., description="{'coolant_celsius': float, 'odometer_total': float, 'engine_rpm': float, 'fuel_ratio': float}")
    diagnostics: dict[str, Any] | None = Field(default_factory=dict, description="{'fault_codes': List[str], 'mil_active': bool}")
    ev_pack: dict[str, float] | None = Field(default=None, description="Optional battery pack data")


class OEMB_Payload(BaseModel):
    """
    OEM_B: Commercial freight fleet format (compact flat structure, ISO timestamps, comma-separated DTCs).
    """
    dev_vin: str
    tenant_id: str
    timestamp_iso: str
    pos_lat: float
    pos_lon: float
    spd_kmh: float
    heading: float | None = 0.0
    eng_temp: float | None = None
    odo_km: float
    dtcs: str | None = ""  # Comma-separated like "P0128,P0300"
    prop_type: str | None = "ICE"
    soc: float | None = None
    fuel_level: float | None = None


class OEMC_Payload(BaseModel):
    """
    OEM_C: Modern EV Telematics format (array coordinates [lon, lat], camelCase, milliseconds epoch).
    """
    vinCode: str
    tenantId: str
    recordedAtMs: int
    coordinates: list[float]  # [longitude, latitude]
    speedKph: float
    batterySocPercent: float
    packTempCelsius: float
    odometerKm: float
    activeDtcList: list[str] = Field(default_factory=list)
    chargingStatus: str | None = "DISCHARGING"


def normalize_oem_payload(oem: str, payload: dict[str, Any], vehicle_id: str | None = None) -> CanonicalTelemetryEvent:
    """
    Transforms any raw OEM payload dictionary into a CanonicalTelemetryEvent.
    Raises ValueError on invalid schema.
    """
    v_id = vehicle_id or str(uuid.uuid4())
    oem_upper = oem.upper()

    if oem_upper == "OEM_A":
        model = OEMA_Payload.model_validate(payload)
        ev = model.ev_pack or {}
        event_time = datetime.fromtimestamp(model.telemetry_epoch, tz=timezone.utc)
        dtcs = model.diagnostics.get("fault_codes", []) if model.diagnostics else []
        propulsion = PropulsionType.EV if model.ev_pack else PropulsionType.ICE

        return CanonicalTelemetryEvent(
            vehicle_id=v_id,
            vin=model.vehicle_ident,
            tenant_id=model.tenant_code,
            event_time=event_time,
            oem="OEM_A",
            lat=model.gps.get("latitude", 0.0),
            lon=model.gps.get("longitude", 0.0),
            speed_kmh=model.gps.get("speed_kph", 0.0),
            heading_deg=model.gps.get("heading", 0.0),
            odometer_km=float(model.sensors.get("odometer_total", 0.0)),
            propulsion_type=propulsion,
            engine_temp_c=model.sensors.get("coolant_celsius"),
            battery_temp_c=ev.get("pack_temp_celsius"),
            soc_pct=ev.get("soc_percent"),
            fuel_pct=model.sensors.get("fuel_ratio", 0.0) * 100.0 if "fuel_ratio" in model.sensors else None,
            dtc_codes=dtcs,
            event_type=EventType.DTC_TRIGGER if dtcs else EventType.NORMAL,
            is_anomaly=bool(dtcs or (model.sensors.get("coolant_celsius", 0) > 105.0))
        )

    elif oem_upper == "OEM_B":
        model = OEMB_Payload.model_validate(payload)
        try:
            event_time = datetime.fromisoformat(model.timestamp_iso.replace("Z", "+00:00"))
        except Exception:
            event_time = datetime.now(timezone.utc)

        dtc_list = [c.strip() for c in model.dtcs.split(",") if c.strip()] if model.dtcs else []
        prop = PropulsionType.EV if model.prop_type == "EV" else PropulsionType.ICE

        return CanonicalTelemetryEvent(
            vehicle_id=v_id,
            vin=model.dev_vin,
            tenant_id=model.tenant_id,
            event_time=event_time,
            oem="OEM_B",
            lat=model.pos_lat,
            lon=model.pos_lon,
            speed_kmh=model.spd_kmh,
            heading_deg=model.heading or 0.0,
            odometer_km=model.odo_km,
            propulsion_type=prop,
            engine_temp_c=model.eng_temp,
            soc_pct=model.soc,
            fuel_pct=model.fuel_level,
            dtc_codes=dtc_list,
            event_type=EventType.DTC_TRIGGER if dtc_list else EventType.NORMAL,
            is_anomaly=bool(dtc_list or (model.eng_temp and model.eng_temp > 105.0))
        )

    elif oem_upper == "OEM_C":
        model = OEMC_Payload.model_validate(payload)
        event_time = datetime.fromtimestamp(model.recordedAtMs / 1000.0, tz=timezone.utc)
        lon = model.coordinates[0] if len(model.coordinates) > 0 else 0.0
        lat = model.coordinates[1] if len(model.coordinates) > 1 else 0.0

        return CanonicalTelemetryEvent(
            vehicle_id=v_id,
            vin=model.vinCode,
            tenant_id=model.tenantId,
            event_time=event_time,
            oem="OEM_C",
            lat=lat,
            lon=lon,
            speed_kmh=model.speedKph,
            heading_deg=0.0,
            odometer_km=model.odometerKm,
            propulsion_type=PropulsionType.EV,
            battery_temp_c=model.packTempCelsius,
            soc_pct=model.batterySocPercent,
            dtc_codes=model.activeDtcList,
            event_type=EventType.DTC_TRIGGER if model.activeDtcList else EventType.NORMAL,
            is_anomaly=bool(model.activeDtcList or model.packTempCelsius > 55.0)
        )

    else:
        raise ValueError(f"Unsupported OEM identifier: '{oem}'")
