"""
FleetPulse Simulator — Fault and Anomaly Scenarios
Handles targeted failure injection, duplicate storms, out-of-order jitter, and burst traffic.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
import random
from typing import Any, Dict, List, Optional
import uuid

from packages.schemas.events import CanonicalTelemetryEvent, EventType, PropulsionType
from apps.simulator.physics import VehiclePhysicsState


class ScenarioName(str, Enum):
    NORMAL = "normal"
    THERMAL_OVERHEAT = "thermal_overheat"
    BRAKE_FAILURE = "brake_failure"
    EV_BATTERY_DEGRADATION = "ev_battery_degradation"
    DUPLICATE_STORM = "duplicate_storm"
    OUT_OF_ORDER = "out_of_order"
    BURST_3X = "burst_3x"
    UNKNOWN_OEM_SCHEMA = "unknown_oem_schema"


class ScenarioEngine:
    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)

    def apply_scenario_to_state(self, scenario: ScenarioName, state: VehiclePhysicsState) -> None:
        """Configures a vehicle physics state to manifest the given anomaly."""
        if scenario == ScenarioName.THERMAL_OVERHEAT:
            state.is_overheating = True
            state.target_speed_kmh = 95.0
        elif scenario == ScenarioName.BRAKE_FAILURE:
            state.is_brake_faulted = True
        elif scenario == ScenarioName.EV_BATTERY_DEGRADATION:
            state.is_rapid_discharging = True
        elif scenario == ScenarioName.NORMAL:
            state.is_overheating = False
            state.is_brake_faulted = False
            state.is_rapid_discharging = False
            state.active_dtcs.clear()

    def generate_event(
        self,
        vehicle_meta: Dict[str, Any],
        physics_state: VehiclePhysicsState,
        scenario: ScenarioName = ScenarioName.NORMAL,
        dt_seconds: float = 1.0,
        now: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Advances physics and generates one or more telemetry events (handles duplicates and out-of-order).
        Returns a list of event payloads.
        """
        current_time = now or datetime.now(timezone.utc)
        event_type, is_anomaly = physics_state.step(dt_seconds=dt_seconds)

        base_event_time = current_time
        if scenario == ScenarioName.OUT_OF_ORDER and self.rng.random() < 0.20:
            # Shift event_time backwards by 10 to 35 seconds to simulate delayed batch flush
            base_event_time = current_time - timedelta(seconds=self.rng.uniform(10.0, 35.0))

        canonical_event = CanonicalTelemetryEvent(
            event_id=str(uuid.uuid4()),
            vehicle_id=vehicle_meta["id"],
            vin=vehicle_meta["vin"],
            tenant_id=vehicle_meta["tenant_id"],
            event_time=base_event_time,
            ingest_time=current_time,
            sequence_no=int(physics_state.odometer_km * 10),
            oem=vehicle_meta.get("oem", "OEM_A"),
            lat=round(physics_state.lat, 6),
            lon=round(physics_state.lon, 6),
            speed_kmh=round(physics_state.speed_kmh, 1),
            heading_deg=round(physics_state.heading, 1),
            odometer_km=round(physics_state.odometer_km, 2),
            propulsion_type=physics_state.propulsion_type,
            engine_temp_c=round(physics_state.engine_temp_c, 1) if physics_state.engine_temp_c is not None else None,
            battery_temp_c=round(physics_state.battery_temp_c, 1) if physics_state.battery_temp_c is not None else None,
            soc_pct=round(physics_state.soc_pct, 1) if physics_state.soc_pct is not None else None,
            fuel_pct=round(physics_state.fuel_pct, 1) if physics_state.fuel_pct is not None else None,
            oil_pressure_kpa=physics_state.oil_pressure_kpa,
            battery_voltage=physics_state.battery_voltage,
            dtc_codes=list(physics_state.active_dtcs),
            event_type=event_type,
            is_anomaly=is_anomaly
        )

        event_dict = canonical_event.model_dump(mode="json")
        results = [event_dict]

        # Duplicate injection: duplicate the exact same event
        if scenario == ScenarioName.DUPLICATE_STORM and self.rng.random() < 0.25:
            dup_dict = dict(event_dict)
            dup_dict["ingest_time"] = (current_time + timedelta(milliseconds=self.rng.uniform(50, 400))).isoformat()
            results.append(dup_dict)

        # Corrupt / Unknown OEM schema injection
        if scenario == ScenarioName.UNKNOWN_OEM_SCHEMA and self.rng.random() < 0.30:
            corrupt_event = {
                "corrupted_stream_header": "0xDEADBEEF",
                "oem": "OEM_UNKNOWN_CORRUPT",
                "raw_buffer": "FF00AA998877",
                "timestamp_epoch": 123456789,
                "tenant_id": vehicle_meta["tenant_id"]
            }
            results.append(corrupt_event)

        return results
