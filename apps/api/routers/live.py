"""
FleetPulse Backend API — Live WebSocket Stream and Scenario Injection Router
"""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from apps.api.core.dependencies import UserContext, get_current_user
from apps.api.data.store import store

logger = logging.getLogger("fleetpulse.live")
router = APIRouter(tags=["Live Stream & Scenarios"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = set()
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead_connections.add(conn)
        for dead in dead_connections:
            self.active_connections.discard(dead)


manager = ConnectionManager()


@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Initial greeting with current fleet summary
        summary = store.get_fleet_summary(tenant_id=store.generator.tenant_id)
        await websocket.send_json({
            "type": "INITIAL_FLEET_STATE",
            "payload": summary.model_dump(mode="json")
        })

        while True:
            # Client heartbeat or command
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)


class ScenarioRequest(BaseModel):
    scenario: str = "thermal_overheat"  # thermal_overheat, brake_failure, ev_battery_degradation, burst_3x, normal


@router.post("/demo/scenario")
async def trigger_scenario(req: ScenarioRequest, user: UserContext = Depends(get_current_user)):
    """
    Demo scenario injection endpoint.
    Applies failure scenario to a target vehicle and broadcasts immediate alert to connected WebSocket clients.
    """
    result = store.inject_scenario(tenant_id=user.tenant_id, scenario_str=req.scenario)

    # Broadcast event to all WebSocket clients
    await manager.broadcast({
        "type": "SCENARIO_INJECTED",
        "payload": {
            "scenario": req.scenario,
            "target_vehicle": result.get("target_vehicle"),
            "new_priority_score": result.get("new_priority_score"),
            "new_severity": result.get("new_severity"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    })

    return result
