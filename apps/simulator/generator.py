"""
FleetPulse Simulator — Deterministic 100K+ Vehicle Fleet Generator
Generates reproducible synthetic fleets with VINs, specs, geographic hubs, and state.
"""

import hashlib
import random
from typing import Dict, List, Optional
import uuid

from packages.schemas.events import PropulsionType, SeverityLevel, VehicleStatus
from apps.simulator.physics import VehiclePhysicsState


FLEET_METROS = [
    {"name": "Chicago Metro Hub", "lat": 41.8781, "lon": -87.6298, "radius_deg": 0.4},
    {"name": "Dallas-Fort Worth Hub", "lat": 32.7767, "lon": -96.7970, "radius_deg": 0.5},
    {"name": "Atlanta Distribution Centre", "lat": 33.7490, "lon": -84.3880, "radius_deg": 0.45},
    {"name": "Los Angeles Port Hub", "lat": 34.0522, "lon": -118.2437, "radius_deg": 0.5},
    {"name": "New York Metro Logistics", "lat": 40.7128, "lon": -74.0060, "radius_deg": 0.35},
    {"name": "Frankfurt Central Hub", "lat": 50.1109, "lon": 8.6821, "radius_deg": 0.3},
    {"name": "Rotterdam Gateway", "lat": 51.9244, "lon": 4.4777, "radius_deg": 0.3},
]

VEHICLE_CATALOG = [
    {"make": "Freightliner", "model": "Cascadia", "year": 2023, "propulsion": PropulsionType.ICE, "oem": "OEM_B", "weight": 2.5},
    {"make": "Freightliner", "model": "eCascadia", "year": 2024, "propulsion": PropulsionType.EV, "oem": "OEM_C", "weight": 2.0},
    {"make": "Ford", "model": "Transit 350", "year": 2022, "propulsion": PropulsionType.ICE, "oem": "OEM_A", "weight": 3.0},
    {"make": "Ford", "model": "E-Transit Cargo", "year": 2024, "propulsion": PropulsionType.EV, "oem": "OEM_C", "weight": 2.0},
    {"make": "Mercedes-Benz", "model": "Sprinter 2500", "year": 2023, "propulsion": PropulsionType.ICE, "oem": "OEM_A", "weight": 2.5},
    {"make": "Volvo", "model": "FH Electric", "year": 2024, "propulsion": PropulsionType.EV, "oem": "OEM_C", "weight": 1.5},
    {"make": "Volvo", "model": "VNL 860", "year": 2022, "propulsion": PropulsionType.ICE, "oem": "OEM_B", "weight": 2.0},
]

# Valid VIN characters (ISO 3779 excludes I, O, Q)
VIN_CHARS = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ"


def generate_synthetic_vin(seed_key: str) -> str:
    """Generates a deterministic 17-character VIN with no illegal characters (I, O, Q)."""
    h = hashlib.sha256(seed_key.encode("utf-8")).hexdigest().upper()
    vin_chars = []
    for i in range(17):
        idx = int(h[i * 2 : i * 2 + 2], 16) % len(VIN_CHARS)
        vin_chars.append(VIN_CHARS[idx])
    return "".join(vin_chars)


class FleetGenerator:
    def __init__(self, tenant_id: str = "e2b10a24-1f33-4f24-9df2-5c8e44123456", seed: int = 42):
        self.tenant_id = tenant_id
        self.seed = seed
        self.rng = random.Random(seed)

    def generate_fleet(self, count: int = 100000) -> List[Dict]:
        """
        Generates deterministic fleet vehicle metadata for 'count' vehicles.
        """
        vehicles = []
        for i in range(count):
            seed_key = f"{self.seed}:{self.tenant_id}:v_{i}"
            v_rng = random.Random(seed_key)

            v_id = str(uuid.UUID(hashlib.md5(seed_key.encode("utf-8")).hexdigest()))
            vin = generate_synthetic_vin(seed_key)

            # Assign catalog model
            spec = v_rng.choices(VEHICLE_CATALOG, weights=[s["weight"] for s in VEHICLE_CATALOG])[0]
            metro = v_rng.choice(FLEET_METROS)

            # Geographic dispersion around metro hub
            lat = metro["lat"] + v_rng.uniform(-metro["radius_deg"], metro["radius_deg"])
            lon = metro["lon"] + v_rng.uniform(-metro["radius_deg"], metro["radius_deg"])

            odometer_km = round(v_rng.uniform(4000.0, 185000.0), 1)

            # Initial baseline risk profile
            risk_roll = v_rng.random()
            if risk_roll < 0.88:
                risk_score = round(v_rng.uniform(5.0, 35.0), 1)
                severity = SeverityLevel.LOW
            elif risk_roll < 0.96:
                risk_score = round(v_rng.uniform(36.0, 65.0), 1)
                severity = SeverityLevel.MEDIUM
            elif risk_roll < 0.99:
                risk_score = round(v_rng.uniform(66.0, 85.0), 1)
                severity = SeverityLevel.HIGH
            else:
                risk_score = round(v_rng.uniform(86.0, 99.5), 1)
                severity = SeverityLevel.CRITICAL

            vehicle_record = {
                "id": v_id,
                "tenant_id": self.tenant_id,
                "fleet_id": f"fleet-{metro['name'].lower().replace(' ', '-')}",
                "vin": vin,
                "license_plate": f"FP-{vin[9:15]}",
                "make": spec["make"],
                "model": spec["model"],
                "year": spec["year"],
                "propulsion_type": spec["propulsion"].value,
                "oem": spec["oem"],
                "odometer_km": odometer_km,
                "status": VehicleStatus.ACTIVE.value,
                "current_risk_score": risk_score,
                "current_severity": severity.value,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "hub_name": metro["name"]
            }
            vehicles.append(vehicle_record)

        return vehicles

    def create_physics_states(self, vehicles: List[Dict]) -> Dict[str, VehiclePhysicsState]:
        """Instantiates in-memory physics trackers for vehicles."""
        states = {}
        for v in vehicles:
            p_type = PropulsionType(v["propulsion_type"])
            state = VehiclePhysicsState(
                vehicle_id=v["id"],
                vin=v["vin"],
                propulsion_type=p_type,
                lat=v["lat"],
                lon=v["lon"],
                odometer_km=v["odometer_km"],
                seed=self.seed
            )
            states[v["id"]] = state
        return states
