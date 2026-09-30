"""
BDD Acceptance Tests — Key Fleet Manager User Stories
Tests end-to-end user journeys matching Section 2.3 of the Master Execution Plan.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from apps.api.main import app


@pytest.mark.asyncio
async def test_story_1_telemetry_anomaly_to_prioritized_alert():
    """
    Scenario: Critical physical anomaly triggers prioritized risk alert
      Given a connected fleet monitored by FleetPulse
      When a vehicle emits abnormal telemetry (engine temperature climb)
      Then the streaming risk engine calculates Priority = P x I x U
      And a CRITICAL severity alert appears in the risk queue with explainable factors.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Trigger fault scenario on fleet
        inject_resp = await client.post("/api/v1/demo/scenario", json={"scenario": "thermal_overheat"})
        assert inject_resp.status_code == 200
        injected = inject_resp.json()
        assert injected["status"] == "success"
        target_vin = injected["target_vehicle"]

        # Step 2: Verify vehicle risk has been updated to CRITICAL
        v_resp = await client.get(f"/api/v1/vehicles?query={target_vin}")
        assert v_resp.status_code == 200
        items = v_resp.json()["items"]
        assert len(items) > 0
        target_v = items[0]
        assert target_v["current_severity"] == "CRITICAL"

        # Step 3: Inspect explainable contributing factors
        risk_resp = await client.get(f"/api/v1/vehicles/{target_v['id']}/risk")
        assert risk_resp.status_code == 200
        risk_data = risk_resp.json()
        assert risk_data["severity"] == "CRITICAL"
        assert risk_data["priority_score"] >= 60.0
        assert len(risk_data["contributing_factors"]) > 0


@pytest.mark.asyncio
async def test_story_2_alert_acknowledgement_and_audit():
    """
    Scenario: Fleet manager acknowledges alert and records audit log
      Given an open risk alert in the queue
      When the fleet manager acknowledges the alert
      Then the alert status transitions to ACKNOWLEDGED
      And an audit record is committed to the immutable audit store.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Fetch open alert
        alerts_resp = await client.get("/api/v1/alerts?limit=1&status=OPEN")
        alerts_data = alerts_resp.json()["items"]
        if not alerts_data:
            pytest.skip("No open alerts to acknowledge")

        target_alert = alerts_data[0]
        alert_id = target_alert["id"]

        # Step 2: Acknowledge alert
        ack_resp = await client.post(f"/api/v1/alerts/{alert_id}/ack")
        assert ack_resp.status_code == 200
        assert ack_resp.json()["status"] == "success"

        # Step 3: Verify audit log recorded the action
        audit_resp = await client.get("/api/v1/audit?limit=10")
        assert audit_resp.status_code == 200
        logs = audit_resp.json()
        assert any(entry["action"] == "ACKNOWLEDGE_ALERT" and entry["entity_id"] == alert_id for entry in logs)


@pytest.mark.asyncio
async def test_story_3_copilot_bounded_write_confirmation():
    """
    Scenario: Fleet Copilot enforces 2-step confirmation for state mutations
      Given a user querying Fleet Copilot to schedule repairs
      When the AI suggests a maintenance action
      Then the Copilot returns requires_confirmation=True without writing to database
      And only after explicit confirmation is the work order committed.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Initial query requesting a write action
        resp1 = await client.post(
            "/api/v1/copilot/query",
            json={"query": "Schedule urgent repair for vehicle"}
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["requires_confirmation"] is True
        assert data1["confirmation_payload"] is not None

        # Step 2: Confirm action
        resp2 = await client.post(
            "/api/v1/copilot/query",
            json={
                "query": "Confirmed by manager",
                "confirm_action": True,
                "tool_arguments": data1["confirmation_payload"]
            }
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert "successfully scheduled" in data2["answer"]
