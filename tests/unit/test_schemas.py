"""
Unit Tests for FleetPulse Canonical and OEM Schemas
"""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from packages.schemas.events import CanonicalTelemetryEvent, EventType, PropulsionType, SeverityLevel
from packages.schemas.oem import normalize_oem_payload
from packages.schemas.models import RiskExplanation, ContributingFactor


def test_canonical_event_valid():
    event = CanonicalTelemetryEvent(
        vehicle_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        vin="1HGCR2F83HA123456",
        tenant_id="e2b10a24-1f33-4f24-9df2-5c8e44123456",
        event_time=datetime.now(timezone.utc),
        oem="OEM_A",
        lat=37.7749,
        lon=-122.4194,
        speed_kmh=65.5,
        odometer_km=14205.8,
        propulsion_type=PropulsionType.ICE,
        engine_temp_c=92.0,
        dtc_codes=["P0128"]
    )
    assert event.vin == "1HGCR2F83HA123456"
    assert event.speed_kmh == 65.5
    assert "P0128" in event.dtc_codes
    assert event.schema_version == "1.0.0"


def test_canonical_event_vin_validation():
    # Invalid length
    with pytest.raises(ValidationError):
        CanonicalTelemetryEvent(
            vehicle_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
            vin="SHORTVIN",
            tenant_id="e2b10a24-1f33-4f24-9df2-5c8e44123456",
            event_time=datetime.now(timezone.utc),
            oem="OEM_A",
            lat=37.0,
            lon=-122.0,
            speed_kmh=50.0,
            odometer_km=100.0
        )

    # Illegal character 'O' in VIN
    with pytest.raises(ValidationError):
        CanonicalTelemetryEvent(
            vehicle_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
            vin="1HGCR2F83HA12345O",
            tenant_id="e2b10a24-1f33-4f24-9df2-5c8e44123456",
            event_time=datetime.now(timezone.utc),
            oem="OEM_A",
            lat=37.0,
            lon=-122.0,
            speed_kmh=50.0,
            odometer_km=100.0
        )


def test_oem_a_normalization():
    raw_payload = {
        "vehicle_ident": "1HGCR2F83HA123456",
        "tenant_code": "tenant-001",
        "telemetry_epoch": 1696118400.0,
        "gps": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "speed_kph": 88.0,
            "heading": 180.0
        },
        "sensors": {
            "coolant_celsius": 108.5,
            "odometer_total": 45120.0,
            "engine_rpm": 2400.0,
            "fuel_ratio": 0.65
        },
        "diagnostics": {
            "fault_codes": ["P0300", "P0128"],
            "mil_active": True
        }
    }

    event = normalize_oem_payload("OEM_A", raw_payload)
    assert event.vin == "1HGCR2F83HA123456"
    assert event.tenant_id == "tenant-001"
    assert event.lat == 40.7128
    assert event.engine_temp_c == 108.5
    assert event.dtc_codes == ["P0300", "P0128"]
    assert event.is_anomaly is True


def test_oem_b_normalization():
    raw_payload = {
        "dev_vin": "3VWDP7AJ9EM123456",
        "tenant_id": "tenant-002",
        "timestamp_iso": "2026-09-30T10:15:30Z",
        "pos_lat": 34.0522,
        "pos_lon": -118.2437,
        "spd_kmh": 45.2,
        "odo_km": 12890.0,
        "eng_temp": 89.0,
        "dtcs": "P0420,U0100"
    }

    event = normalize_oem_payload("OEM_B", raw_payload)
    assert event.vin == "3VWDP7AJ9EM123456"
    assert event.tenant_id == "tenant-002"
    assert event.speed_kmh == 45.2
    assert event.dtc_codes == ["P0420", "U0100"]


def test_oem_c_normalization():
    raw_payload = {
        "vinCode": "5YJSA1E28HF123456",
        "tenantId": "tenant-003",
        "recordedAtMs": 1727700000000,
        "coordinates": [-122.4194, 37.7749],
        "speedKph": 110.0,
        "batterySocPercent": 68.5,
        "packTempCelsius": 42.0,
        "odometerKm": 25000.0,
        "activeDtcList": []
    }

    event = normalize_oem_payload("OEM_C", raw_payload)
    assert event.vin == "5YJSA1E28HF123456"
    assert event.propulsion_type == PropulsionType.EV
    assert event.soc_pct == 68.5
    assert event.battery_temp_c == 42.0
    assert event.lat == 37.7749
    assert event.lon == -122.4194


def test_unsupported_oem_quarantine_error():
    with pytest.raises(ValueError, match="Unsupported OEM identifier"):
        normalize_oem_payload("OEM_UNKNOWN_XYZ", {})


def test_risk_explanation_contract():
    explanation = RiskExplanation(
        priority_score=85.5,
        risk_probability=0.85,
        impact_exposure=8.2,
        urgency_factor=4.0,
        severity=SeverityLevel.HIGH,
        contributing_factors=[
            ContributingFactor(factor="Thermal Gradient", weight=0.45, value="+1.8 C/min"),
            ContributingFactor(factor="Active DTC", weight=0.35, detail="Engine Misfire")
        ]
    )
    assert explanation.priority_score == 85.5
    assert len(explanation.contributing_factors) == 2
