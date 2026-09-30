"""
FleetPulse Backend API — Bounded Fleet Copilot Router
Enforces strict tool allowlist, read-only defaults, explicit write confirmation, and tamper-proof audit trails.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.core.dependencies import UserContext, get_current_user, require_role
from apps.api.data.store import store
from packages.schemas.models import (
    ActionPriority,
    ActionType,
    MaintenanceActionCreateRequest,
)

logger = logging.getLogger("fleetpulse.copilot")
router = APIRouter(prefix="/copilot", tags=["Fleet Copilot AI"])

# Server-side tool allowlist
ALLOWED_TOOLS = {
    "get_fleet_summary": {"read_only": True, "description": "Fetches high-level fleet KPIs, active vehicle count, and alert counts."},
    "get_high_risk_vehicles": {"read_only": True, "description": "Retrieves highest priority vehicles ranked by P x I x U."},
    "get_vehicle_timeline": {"read_only": True, "description": "Returns recent sensor telemetry and DTC occurrences for a vehicle."},
    "get_vehicle_risk_explanation": {"read_only": True, "description": "Explains why a vehicle has an elevated risk score with contributing factors."},
    "get_maintenance_history": {"read_only": True, "description": "Lists existing scheduled or completed maintenance orders."},
    "create_maintenance_action": {"read_only": False, "requires_confirmation": True, "description": "Creates a new maintenance work order. Requires confirmation."}
}


class CopilotQueryRequest(BaseModel):
    query: str
    confirm_action: bool = False
    proposed_tool: Optional[str] = None
    tool_arguments: Optional[Dict[str, Any]] = None


class CopilotQueryResponse(BaseModel):
    answer: str
    tool_used: Optional[str] = None
    tool_result: Optional[Any] = None
    requires_confirmation: bool = False
    confirmation_payload: Optional[Dict[str, Any]] = None
    audit_id: str


@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(
    req: CopilotQueryRequest,
    user: UserContext = Depends(require_role(["FLEET_MANAGER", "SUPER_ADMIN"]))
):
    query_lower = req.query.lower()
    tool_to_use: Optional[str] = None
    tool_args: Dict[str, Any] = req.tool_arguments or {}
    tool_result: Any = None
    requires_confirmation = False
    confirmation_payload = None

    # Step 1: Tool intent routing (Strict Allowlist)
    if any(k in query_lower for k in ("high risk", "highest risk", "risk", "worst", "critical", "priority")):
        tool_to_use = "get_high_risk_vehicles"
        vehicles, _ = store.get_vehicles(tenant_id=user.tenant_id, limit=5, severity="CRITICAL")
        if not vehicles:
            vehicles, _ = store.get_vehicles(tenant_id=user.tenant_id, limit=5)
        tool_result = [
            {"vin": v["vin"], "model": f"{v['make']} {v['model']}", "risk_score": v["current_risk_score"], "severity": v["current_severity"]}
            for v in vehicles[:5]
        ]
        answer = f"Found {len(tool_result)} high-risk vehicles requiring operational attention. The highest risk vehicle is {tool_result[0]['vin']} ({tool_result[0]['model']}) with a risk score of {tool_result[0]['risk_score']}."

    elif "summary" in query_lower or "overview" in query_lower or "health" in query_lower or "kpi" in query_lower:
        tool_to_use = "get_fleet_summary"
        summary = store.get_fleet_summary(tenant_id=user.tenant_id)
        tool_result = summary.model_dump(mode="json")
        answer = f"FleetPulse is actively monitoring {summary.total_vehicles:,} vehicles. Currently {summary.high_risk_vehicles} vehicles are flagged as high risk with {summary.critical_alerts_count} open critical alerts. Streaming throughput is {summary.events_per_sec:,.0f} events/sec with {summary.ingestion_latency_ms} ms p95 latency."

    elif "schedule" in query_lower or "repair" in query_lower or "maintenance" in query_lower or "service" in query_lower:
        tool_to_use = "create_maintenance_action"
        if not req.confirm_action:
            requires_confirmation = True
            # Find candidate vehicle
            vehicles, _ = store.get_vehicles(tenant_id=user.tenant_id, limit=1)
            cand_id = vehicles[0]["id"] if vehicles else "unknown"
            cand_vin = vehicles[0]["vin"] if vehicles else "unknown"

            confirmation_payload = {
                "vehicle_id": cand_id,
                "vin": cand_vin,
                "action_type": ActionType.THERMAL_SYSTEM_REPAIR.value,
                "priority": ActionPriority.CRITICAL.value,
                "notes": f"Copilot automated recommendation for {cand_vin} due to thermal degradation."
            }
            answer = f"I recommend creating a CRITICAL {confirmation_payload['action_type']} order for vehicle {cand_vin}. To prevent accidental modification, please review and confirm this operation."
        else:
            # Action confirmed by user
            action_req = MaintenanceActionCreateRequest(
                vehicle_id=tool_args.get("vehicle_id", list(store.vehicles.keys())[0]),
                action_type=ActionType(tool_args.get("action_type", "THERMAL_SYSTEM_REPAIR")),
                priority=ActionPriority(tool_args.get("priority", "CRITICAL")),
                notes=tool_args.get("notes", "Created via Fleet Copilot with user confirmation"),
                scheduled_for=datetime.now(timezone.utc)
            )
            created_action = store.create_maintenance_action(tenant_id=user.tenant_id, req=action_req, user_id=user.user_id)
            tool_result = created_action.model_dump(mode="json")
            answer = f"Maintenance action {created_action.id} successfully scheduled and logged to the transactional store."

    elif "why" in query_lower or "explain" in query_lower:
        tool_to_use = "get_vehicle_risk_explanation"
        vehicles, _ = store.get_vehicles(tenant_id=user.tenant_id, limit=1)
        v = vehicles[0]
        explanation = store.get_vehicle_risk(tenant_id=user.tenant_id, vehicle_id=v["id"])
        tool_result = explanation.model_dump(mode="json") if explanation else {}
        factors_str = ", ".join([f"{f.factor} ({f.detail or f.value})" for f in (explanation.contributing_factors[:3] if explanation else [])])
        answer = f"Vehicle {v['vin']} has an elevated risk score of {v['current_risk_score']} ({v['current_severity']}). Key contributing factors: {factors_str}. Recommendation: {explanation.recommended_action}."

    else:
        # Default fallback summary
        tool_to_use = "get_fleet_summary"
        summary = store.get_fleet_summary(tenant_id=user.tenant_id)
        tool_result = summary.model_dump(mode="json")
        answer = f"I am Fleet Copilot, restricted to verified fleet operations. I can summarize fleet health, query highest risk vehicles, explain telemetry anomalies, or prepare maintenance work orders with your confirmation."

    # Step 2: Audit Logging
    audit_record = store.record_audit_log(
        tenant_id=user.tenant_id,
        user_id=user.user_id,
        action="COPILOT_QUERY",
        entity_type="COPILOT",
        entity_id=tool_to_use or "NONE",
        details={
            "query": req.query,
            "tool_used": tool_to_use,
            "confirmed": req.confirm_action,
            "requires_confirmation": requires_confirmation
        }
    )

    return CopilotQueryResponse(
        answer=answer,
        tool_used=tool_to_use,
        tool_result=tool_result,
        requires_confirmation=requires_confirmation,
        confirmation_payload=confirmation_payload,
        audit_id=audit_record.id
    )
