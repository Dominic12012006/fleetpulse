# FleetPulse — 100K+ Vehicle Simulator Evidence & Configuration

## Overview
This document provides the operational run log, configuration parameters, and physics benchmark for the FleetPulse Deterministic Fleet Simulator (`apps/simulator/`).

---

## 1. Configuration & Parameters

- **Seed**: `42` (ensures 100% deterministic reproducibility across runs)
- **Monitored Vehicle Count**: `100,000` synthetic commercial vehicles
- **Powertrain Breakdown**:
  - **ICE (Internal Combustion Engine)**: 65% (Freightliner Cascadia, Ford Transit 350, Mercedes-Benz Sprinter 2500, Volvo VNL 860)
  - **EV (Electric Vehicle)**: 35% (Freightliner eCascadia, Ford E-Transit, Volvo FH Electric)
- **Geographic Metro Hubs**:
  1. Chicago Metro Distribution Hub (41.8781°N, -87.6298°W)
  2. Dallas-Fort Worth Freight Corridor (32.7767°N, -96.7970°W)
  3. Atlanta Port Logistics Centre (33.7490°N, -84.3880°W)
  4. Los Angeles Intermodal Port Terminal (34.0522°N, -118.2437°W)
  5. New York Metro Hub (40.7128°N, -74.0060°W)
  6. Frankfurt Continental Transit Hub (50.1109°N, 8.6821°E)
  7. Rotterdam Gateway (51.9244°N, 4.4777°E)

---

## 2. Execution Run Log

```text
2026-09-30 18:44:26,618 [INFO] Generating metadata for 100,000 synthetic vehicles (seed=42)...
2026-09-30 18:45:00,623 [INFO] Generated 100,000 vehicles in 34.00s
2026-09-30 18:45:00,623 [INFO] Starting in-memory throughput benchmark for 200,000 events...
2026-09-30 18:45:43,867 [INFO] Benchmark finished: generated 200,000 events in 43.244s -> 4,625 events/sec (Full Pydantic Serialization)
2026-09-30 18:55:22,402 [INFO] Vectorized Streaming Pipeline: 50,000 events processed in 7.314s -> 6,836.6 events/sec (Single Thread)
2026-09-30 18:57:39,102 [INFO] Seeded 100,000 vehicles successfully.
```

---

## 3. Physics & Thermodynamic Model Verification

1. **ICE Coolant Dynamics**:
   - Nominal thermal range: $88^\circ\text{C}$ to $96^\circ\text{C}$.
   - Failure condition (`thermal_overheat`): coolant climb rate $\ge 1.4^\circ\text{C/min}$ exceeding $115^\circ\text{C}$ ceiling.
   - Diagnostic DTC mapping: `P0128` (Coolant Thermostat Malfunction) and `P0300` (Multiple Cylinder Misfire).
2. **EV Battery Pack Dynamics**:
   - Nominal cell temperature: $25^\circ\text{C}$ to $35^\circ\text{C}$.
   - Rapid discharge failure (`ev_battery_degradation`): cell thermal spike $>55^\circ\text{C}$ and discharge $>1.5\%\text{/min}$.
   - Diagnostic DTC mapping: `P0A80` (Replace Hybrid/EV Battery Pack).
3. **Braking & Kinematics**:
   - Accelerations within physical commercial thresholds: $[-4.5\,\text{m/s}^2, +2.2\,\text{m/s}^2]$.
   - Harsh braking triggers `C0035` (Wheel Speed Sensor Malfunction / ABS Trigger).
