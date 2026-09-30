"""
Unit Tests for Stream Processor, Normalizer, and Risk Engine
"""

from datetime import datetime, timedelta, timezone
from packages.schemas.events import CanonicalTelemetryEvent, EventType, PropulsionType, SeverityLevel
from services.normalizer.normalizer import NormalizerService
from services.stream_processor.processor import StreamProcessorService
from services.risk_engine.engine import BaselineRiskEngine


def test_normalizer_service():
    service = NormalizerService()

    valid_payload = {
        "oem": "OEM_B",
        "dev_vin": "3VWDP7AJ9EM123456",
        "tenant_id": "tenant-001",
        "timestamp_iso": "2026-09-30T12:00:00Z",
        "pos_lat": 41.8781,
        "pos_lon": -87.6298,
        "spd_kmh": 60.0,
        "odo_km": 15000.0,
        "eng_temp": 91.0,
        "dtcs": ""
    }

    corrupt_payload = {
        "corrupted_field": True,
        "garbage_bytes": "XXXX"
    }

    canon_batch, quar_batch = service.process_batch([valid_payload, corrupt_payload])
    assert len(canon_batch) == 1
    assert len(quar_batch) == 1
    assert canon_batch[0].vin == "3VWDP7AJ9EM123456"
    assert "Missing OEM discriminator" in quar_batch[0]["reason"]


def test_stream_processor_deduplication():
    proc = StreamProcessorService()
    now = datetime.now(timezone.utc)

    event = CanonicalTelemetryEvent(
        event_id="dup-event-12345",
        vehicle_id="v-1",
        vin="1HGCR2F83HA123456",
        tenant_id="t-1",
        event_time=now,
        oem="OEM_A",
        lat=40.0,
        lon=-75.0,
        speed_kmh=50.0,
        odometer_km=100.0
    )

    res1 = proc.process_event(event)
    assert res1 is not None, "First event must be processed"
    assert proc.processed_count == 1

    res2 = proc.process_event(event)
    assert res2 is None, "Duplicate event must be dropped"
    assert proc.duplicate_count == 1


def test_stream_processor_watermark_and_lateness():
    proc = StreamProcessorService(allowed_lateness_seconds=5.0)
    base_time = datetime(2026, 9, 30, 12, 0, 0, tzinfo=timezone.utc)

    # Event 1 at 12:00:00
    e1 = CanonicalTelemetryEvent(
        event_id="e1",
        vehicle_id="v-1",
        vin="1HGCR2F83HA123456",
        tenant_id="t-1",
        event_time=base_time,
        oem="OEM_A",
        lat=40.0,
        lon=-75.0,
        speed_kmh=50.0,
        odometer_km=100.0
    )
    proc.process_event(e1)
    assert proc.watermark == base_time - timedelta(seconds=5.0)

    # Event 2 advances watermark to 12:00:30 (watermark = 12:00:25)
    e2 = CanonicalTelemetryEvent(
        event_id="e2",
        vehicle_id="v-1",
        vin="1HGCR2F83HA123456",
        tenant_id="t-1",
        event_time=base_time + timedelta(seconds=30),
        oem="OEM_A",
        lat=40.0,
        lon=-75.0,
        speed_kmh=50.0,
        odometer_km=100.5
    )
    proc.process_event(e2)
    assert proc.watermark == base_time + timedelta(seconds=25)

    # Event 3 is late: event_time is 12:00:10 (prior to watermark 12:00:25)
    e3_late = CanonicalTelemetryEvent(
        event_id="e3_late",
        vehicle_id="v-1",
        vin="1HGCR2F83HA123456",
        tenant_id="t-1",
        event_time=base_time + timedelta(seconds=10),
        oem="OEM_A",
        lat=40.0,
        lon=-75.0,
        speed_kmh=50.0,
        odometer_km=100.2
    )
    features3 = proc.process_event(e3_late)
    assert features3 is not None
    assert features3["is_late"] is True
    assert proc.late_event_count == 1


def test_baseline_risk_engine_critical_thermal():
    engine = BaselineRiskEngine()
    features = {
        "vehicle_id": "v-1",
        "active_dtcs": ["P0128", "P0300"],
        "current_temp": 118.5,
        "temp_slope_c_per_min": 1.6,
        "harsh_events_5m": 1,
        "odometer_km": 45000.0
    }

    result = engine.evaluate(features)
    assert result.severity == SeverityLevel.CRITICAL
    assert result.priority_score >= 60.0
    assert result.urgency_factor == 5.0
    assert any("P0300" in f.factor for f in result.contributing_factors)
    assert any("Temperature" in f.factor for f in result.contributing_factors)


def test_baseline_risk_engine_normal_vehicle():
    engine = BaselineRiskEngine()
    features = {
        "vehicle_id": "v-2",
        "active_dtcs": [],
        "current_temp": 91.0,
        "temp_slope_c_per_min": 0.05,
        "harsh_events_5m": 0,
        "odometer_km": 12000.0
    }

    result = engine.evaluate(features)
    assert result.severity == SeverityLevel.LOW
    assert result.priority_score < 30.0
    assert result.urgency_factor == 1.0
