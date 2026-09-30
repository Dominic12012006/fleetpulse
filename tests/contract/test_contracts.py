"""
Contract & Schema Compatibility Tests
Verifies that API OpenAPI contracts match frontend schema expectations and specifications.
"""

from fastapi.testclient import TestClient

from apps.api.main import app
from packages.schemas.events import CanonicalTelemetryEvent, PropulsionType


def test_openapi_contract_schema():
    client = TestClient(app)
    resp = client.get("/api/v1/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()

    assert "openapi" in schema
    assert schema["info"]["title"] == "FleetPulse Connected Vehicle Intelligence"
    assert schema["info"]["version"] == "1.0.0"

    # Check required API contract routes
    paths = schema["paths"]
    assert "/api/v1/fleet/summary" in paths
    assert "/api/v1/vehicles" in paths
    assert "/api/v1/vehicles/{vehicle_id}" in paths
    assert "/api/v1/vehicles/{vehicle_id}/risk" in paths
    assert "/api/v1/vehicles/{vehicle_id}/timeline" in paths
    assert "/api/v1/alerts" in paths
    assert "/api/v1/alerts/{alert_id}/ack" in paths
    assert "/api/v1/maintenance-actions" in paths
    assert "/api/v1/analytics/risk-distribution" in paths
    assert "/api/v1/copilot/query" in paths
    assert "/api/v1/demo/scenario" in paths


def test_canonical_event_json_serialization():
    from datetime import datetime, timezone
    event = CanonicalTelemetryEvent(
        vehicle_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        vin="1HGCR2F83HA987654",
        tenant_id="e2b10a24-1f33-4f24-9df2-5c8e44123456",
        event_time=datetime.now(timezone.utc),
        oem="OEM_A",
        lat=41.8781,
        lon=-87.6298,
        speed_kmh=80.0,
        odometer_km=15420.5,
        propulsion_type=PropulsionType.ICE,
        engine_temp_c=91.5
    )

    data = event.model_dump(mode="json")
    assert isinstance(data["event_time"], str)
    assert data["vin"] == "1HGCR2F83HA987654"
    assert data["schema_version"] == "1.0.0"
