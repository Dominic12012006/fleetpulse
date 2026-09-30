"""
Integration Tests for FleetPulse Backend API
"""

import pytest
from httpx import AsyncClient, ASGITransport

from apps.api.main import app


@pytest.mark.asyncio
async def test_health_and_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "fleetpulse-api"

        metric_resp = await client.get("/metrics")
        assert metric_resp.status_code == 200
        assert "api_requests_total" in metric_resp.text


@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "manager@fleetpulse.io", "password": "FleetPulse2026!"}
        )
        assert resp.status_code == 200
        token_data = resp.json()
        assert "access_token" in token_data
        assert token_data["role"] == "FLEET_MANAGER"


@pytest.mark.asyncio
async def test_fleet_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/fleet/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_vehicles"] > 0
        assert data["events_per_sec"] > 0


@pytest.mark.asyncio
async def test_vehicles_listing_and_detail():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/vehicles?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 10
        assert data["total"] > 10

        first_v = data["items"][0]
        v_id = first_v["id"]

        detail_resp = await client.get(f"/api/v1/vehicles/{v_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["vin"] == first_v["vin"]

        risk_resp = await client.get(f"/api/v1/vehicles/{v_id}/risk")
        assert risk_resp.status_code == 200
        risk = risk_resp.json()
        assert "priority_score" in risk
        assert "contributing_factors" in risk

        timeline_resp = await client.get(f"/api/v1/vehicles/{v_id}/timeline?points=10")
        assert timeline_resp.status_code == 200
        timeline = timeline_resp.json()
        assert len(timeline["timeline"]) == 10


@pytest.mark.asyncio
async def test_alerts_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/alerts?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        if data["items"]:
            alert_id = data["items"][0]["id"]
            ack_resp = await client.post(f"/api/v1/alerts/{alert_id}/ack")
            assert ack_resp.status_code == 200
            ack_data = ack_resp.json()
            assert ack_data["status"] == "success"
            assert ack_data["alert"]["status"] == "ACKNOWLEDGED"


@pytest.mark.asyncio
async def test_maintenance_action_creation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get a vehicle
        v_resp = await client.get("/api/v1/vehicles?limit=1")
        vehicle = v_resp.json()["items"][0]

        req_payload = {
            "vehicle_id": vehicle["id"],
            "action_type": "BRAKE_SERVICE",
            "priority": "URGENT",
            "notes": "Scheduled brake pad replacement based on high severity DTC",
            "scheduled_for": "2026-10-02T10:00:00Z"
        }
        create_resp = await client.post("/api/v1/maintenance-actions", json=req_payload)
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["action_type"] == "BRAKE_SERVICE"
        assert created["priority"] == "URGENT"


@pytest.mark.asyncio
async def test_copilot_query():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Query high risk
        resp1 = await client.post(
            "/api/v1/copilot/query",
            json={"query": "Which vehicles are at highest risk right now?"}
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["tool_used"] == "get_high_risk_vehicles"
        assert len(data1["tool_result"]) > 0

        # Test 2: Query fleet overview
        resp2 = await client.post(
            "/api/v1/copilot/query",
            json={"query": "Give me a summary of current fleet operations."}
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["tool_used"] == "get_fleet_summary"
        assert "events_per_sec" in data2["tool_result"]


@pytest.mark.asyncio
async def test_scenario_injection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/demo/scenario",
            json={"scenario": "thermal_overheat"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["scenario"] == "thermal_overheat"
        assert data["new_severity"] == "CRITICAL"
