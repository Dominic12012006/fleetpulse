"""
FleetPulse Simulator — Kinematic & Thermodynamic Physics Engine
Simulates realistic vehicle state transitions for ICE, EV, and Hybrid powertrains.
"""

import math
import random

from packages.schemas.events import EventType, PropulsionType


class VehiclePhysicsState:
    def __init__(
        self,
        vehicle_id: str,
        vin: str,
        propulsion_type: PropulsionType,
        lat: float,
        lon: float,
        odometer_km: float,
        seed: int = 42
    ):
        self.vehicle_id = vehicle_id
        self.vin = vin
        self.propulsion_type = propulsion_type
        self.lat = lat
        self.lon = lon
        self.heading = random.uniform(0, 360)
        self.odometer_km = odometer_km
        self.speed_kmh = 0.0
        self.target_speed_kmh = random.uniform(30.0, 95.0)

        # ICE parameters
        self.engine_temp_c = 90.0 if propulsion_type in (PropulsionType.ICE, PropulsionType.HYBRID) else None
        self.fuel_pct = random.uniform(35.0, 95.0) if propulsion_type in (PropulsionType.ICE, PropulsionType.HYBRID) else None
        self.oil_pressure_kpa = 320.0 if propulsion_type in (PropulsionType.ICE, PropulsionType.HYBRID) else None

        # EV parameters
        self.battery_temp_c = 28.0 if propulsion_type in (PropulsionType.EV, PropulsionType.HYBRID) else None
        self.soc_pct = random.uniform(40.0, 98.0) if propulsion_type in (PropulsionType.EV, PropulsionType.HYBRID) else None
        self.battery_voltage = 380.0 if propulsion_type in (PropulsionType.EV, PropulsionType.HYBRID) else 12.6

        # Diagnostics & Faults
        self.active_dtcs: list[str] = []
        self.is_overheating: bool = False
        self.is_rapid_discharging: bool = False
        self.is_brake_faulted: bool = False
        self.harsh_braking_events: int = 0
        self.mileage_since_last_service: float = random.uniform(500.0, 18000.0)

    def step(self, dt_seconds: float = 1.0) -> tuple[EventType, bool]:
        """
        Advances vehicle state by dt_seconds.
        Returns (EventType, is_anomaly).
        """
        # Kinematics: accelerate/decelerate toward target speed
        speed_delta = (self.target_speed_kmh - self.speed_kmh) * 0.15
        self.speed_kmh = max(0.0, min(140.0, self.speed_kmh + speed_delta + random.uniform(-1.0, 1.0)))

        # Distance step
        distance_km = (self.speed_kmh / 3600.0) * dt_seconds
        self.odometer_km += distance_km
        self.mileage_since_last_service += distance_km

        # Geographic displacement (1 deg latitude ~= 111 km)
        rad = math.radians(self.heading)
        d_lat = (distance_km * math.cos(rad)) / 111.0
        d_lon = (distance_km * math.sin(rad)) / (111.0 * max(0.2, math.cos(math.radians(self.lat))))
        self.lat += d_lat
        self.lon += d_lon
        self.heading = (self.heading + random.uniform(-3.0, 3.0)) % 360.0

        event_type = EventType.NORMAL
        is_anomaly = False

        # Thermodynamics & Consumables
        if self.propulsion_type in (PropulsionType.ICE, PropulsionType.HYBRID):
            if self.is_overheating:
                # Rapid temperature climb
                self.engine_temp_c = min(135.0, (self.engine_temp_c or 90.0) + random.uniform(0.8, 1.6) * dt_seconds)
                event_type = EventType.OVERHEAT
                is_anomaly = True
                if "P0128" not in self.active_dtcs:
                    self.active_dtcs.append("P0128")
                if self.engine_temp_c > 115.0 and "P0300" not in self.active_dtcs:
                    self.active_dtcs.append("P0300")
            else:
                # Normal thermal equilibrium ~88-96 C
                target_temp = 92.0 + (self.speed_kmh / 120.0) * 4.0
                self.engine_temp_c += (target_temp - self.engine_temp_c) * 0.05 + random.uniform(-0.2, 0.2)

            # Fuel consumption
            if self.fuel_pct is not None:
                self.fuel_pct = max(0.0, self.fuel_pct - (distance_km * 0.008))

        if self.propulsion_type in (PropulsionType.EV, PropulsionType.HYBRID):
            if self.is_rapid_discharging:
                # Severe thermal stress and rapid SoC drop
                self.battery_temp_c = min(75.0, (self.battery_temp_c or 28.0) + random.uniform(0.6, 1.2) * dt_seconds)
                self.soc_pct = max(0.0, (self.soc_pct or 50.0) - random.uniform(0.3, 0.8) * dt_seconds)
                event_type = EventType.RAPID_DISCHARGE
                is_anomaly = True
                if "P0A80" not in self.active_dtcs:
                    self.active_dtcs.append("P0A80")
            else:
                target_battery_temp = 32.0 + (self.speed_kmh / 100.0) * 3.0
                self.battery_temp_c += (target_battery_temp - self.battery_temp_c) * 0.02 + random.uniform(-0.1, 0.1)
                if self.soc_pct is not None:
                    self.soc_pct = max(0.0, self.soc_pct - (distance_km * 0.015))

        if self.is_brake_faulted:
            if random.random() < 0.25:
                self.speed_kmh = max(0.0, self.speed_kmh - random.uniform(25.0, 45.0))
                self.harsh_braking_events += 1
                event_type = EventType.HARSH_BRAKE
                is_anomaly = True
                if "C0035" not in self.active_dtcs:
                    self.active_dtcs.append("C0035")

        if self.active_dtcs and event_type == EventType.NORMAL:
            event_type = EventType.DTC_TRIGGER
            is_anomaly = True

        return event_type, is_anomaly
