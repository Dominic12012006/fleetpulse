"""
FleetPulse — Predictive Risk Engine & Baseline Scoring Model
Implements Priority = RiskProbability x ImpactExposure x UrgencyFactor with explainability.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple

from packages.schemas.events import SeverityLevel
from packages.schemas.models import ContributingFactor, RiskExplanation

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.risk_engine")

# Known DTC critical severity weights
DTC_WEIGHTS = {
    "P0128": {"name": "Coolant Thermostat Failure", "weight": 0.38, "severity": 0.40, "action": "Thermostat & coolant inspection"},
    "P0300": {"name": "Random/Multiple Cylinder Misfire", "weight": 0.45, "severity": 0.55, "action": "Ignition coil and spark plug check"},
    "P0420": {"name": "Catalyst System Efficiency", "weight": 0.20, "severity": 0.25, "action": "Emissions sensor verification"},
    "U0100": {"name": "Lost Communication with ECM", "weight": 0.50, "severity": 0.65, "action": "CAN bus harness diagnostic"},
    "P0A80": {"name": "Hybrid/EV Battery Degradation", "weight": 0.65, "severity": 0.80, "action": "High-voltage battery module test"},
    "C0035": {"name": "Left Front Wheel Speed Sensor (ABS)", "weight": 0.40, "severity": 0.45, "action": "Brake actuator & wheel sensor test"},
    "P0562": {"name": "System Voltage Low", "weight": 0.25, "severity": 0.30, "action": "Alternator & 12V battery test"},
}


class BaselineRiskEngine:
    """
    Transparent deterministic baseline model for predictive fleet reliability.
    Provides verifiable, explainable scoring benchmarks for ML models.
    """
    def __init__(self, model_version: str = "v1.0-baseline"):
        self.model_version = model_version

    def evaluate(self, features: Dict[str, Any], vehicle_class_weight: float = 5.0) -> RiskExplanation:
        """
        Calculates PriorityScore = (P * I * U) mapped to [0, 100].
        Generates structured explainability factors.
        """
        active_dtcs = features.get("active_dtcs", [])
        temp_slope = features.get("temp_slope_c_per_min", 0.0)
        current_temp = features.get("current_temp", 90.0)
        harsh_events_5m = features.get("harsh_events_5m", 0)
        soc_discharge = features.get("soc_discharge_per_min", 0.0)
        odometer_km = features.get("odometer_km", 10000.0)

        contributing_factors: List[ContributingFactor] = []
        prob_components: List[float] = []

        # 1. Diagnostic Trouble Codes (DTCs)
        dtc_risk = 0.0
        for code in active_dtcs:
            spec = DTC_WEIGHTS.get(code, {"name": f"DTC {code}", "weight": 0.25, "severity": 0.30, "action": "Standard diagnostic scan"})
            dtc_risk = max(dtc_risk, spec["severity"])
            contributing_factors.append(
                ContributingFactor(
                    factor=f"DTC: {code}",
                    weight=spec["weight"],
                    detail=spec["name"],
                    value="ACTIVE",
                    threshold="INACTIVE"
                )
            )
        if dtc_risk > 0:
            prob_components.append(dtc_risk)

        # 2. Temperature Dynamics (Coolant / Battery)
        temp_risk = 0.0
        if current_temp > 115.0:  # Severe overheat
            temp_risk = 0.85
            contributing_factors.append(
                ContributingFactor(
                    factor="Critical Engine Temperature",
                    weight=0.50,
                    detail="Coolant exceeds critical thermal boundary",
                    value=f"{current_temp:.1f} °C",
                    threshold="105.0 °C"
                )
            )
        elif current_temp > 105.0:  # High temp
            temp_risk = 0.45
            contributing_factors.append(
                ContributingFactor(
                    factor="Elevated Engine Temperature",
                    weight=0.30,
                    value=f"{current_temp:.1f} °C",
                    threshold="100.0 °C"
                )
            )

        if temp_slope > 1.2:  # Rapid thermal climb
            temp_risk = max(temp_risk, 0.65)
            contributing_factors.append(
                ContributingFactor(
                    factor="Thermal Rate of Climb",
                    weight=0.40,
                    detail="Abnormal heat accumulation rate",
                    value=f"+{temp_slope:.2f} °C/min",
                    threshold="+0.50 °C/min"
                )
            )
        if temp_risk > 0:
            prob_components.append(temp_risk)

        # 3. Harsh Driving / Dynamic Stress
        if harsh_events_5m >= 3:
            harsh_risk = min(0.60, 0.20 + (harsh_events_5m * 0.10))
            prob_components.append(harsh_risk)
            contributing_factors.append(
                ContributingFactor(
                    factor="Braking / Acceleration Stress",
                    weight=0.25,
                    detail="Excessive harsh maneuvers detected",
                    value=f"{harsh_events_5m} events in 5m",
                    threshold="2 events"
                )
            )

        # 4. EV Battery Discharge Velocity
        if soc_discharge > 1.0:
            ev_risk = min(0.90, soc_discharge * 0.45)
            prob_components.append(ev_risk)
            contributing_factors.append(
                ContributingFactor(
                    factor="Rapid Battery Discharge",
                    weight=0.45,
                    detail="Potential cell imbalance or short",
                    value=f"-{soc_discharge:.2f} %/min",
                    threshold="-0.50 %/min"
                )
            )

        # Calculate Combined Risk Probability (Independence model: 1 - prod(1 - P_i))
        if prob_components:
            inv_prod = 1.0
            for p in prob_components:
                inv_prod *= (1.0 - min(0.95, p))
            risk_probability = max(0.05, min(0.99, 1.0 - inv_prod))
        else:
            # Baseline background probability from mileage
            service_cycle_km = 15000.0
            mileage_factor = (odometer_km % service_cycle_km) / service_cycle_km
            risk_probability = round(0.02 + (mileage_factor * 0.12), 3)

        # Impact Exposure (1.0 to 10.0) based on vehicle class and mission
        impact_exposure = round(min(10.0, max(1.0, vehicle_class_weight + (risk_probability * 2.0))), 2)

        # Urgency Factor (1.0 to 5.0)
        if current_temp > 115.0 or "P0A80" in active_dtcs or "P0300" in active_dtcs:
            urgency_factor = 5.0
            recommended_action = "Immediate vehicle grounding & dispatch maintenance unit"
        elif temp_slope > 1.0 or harsh_events_5m >= 4:
            urgency_factor = 3.5
            recommended_action = "Schedule workshop inspection within 24 hours"
        elif active_dtcs or risk_probability > 0.40:
            urgency_factor = 2.0
            recommended_action = "Inspect diagnostics during next depot return"
        else:
            urgency_factor = 1.0
            recommended_action = "Continue regular monitoring"

        # Composite Priority: P * I * U mapped to 0-100 scale
        # P in [0, 1], I in [1, 10], U in [1, 5] -> Max raw product = 1 * 10 * 5 = 50.0 -> Multiply by 2.0
        raw_score = risk_probability * impact_exposure * urgency_factor * 2.0
        priority_score = round(min(100.0, max(0.0, raw_score)), 1)

        # Severity categorization calibrated to enterprise risk matrix
        if priority_score >= 60.0 or (urgency_factor >= 5.0 and risk_probability >= 0.80):
            severity = SeverityLevel.CRITICAL
        elif priority_score >= 40.0 or urgency_factor >= 3.5:
            severity = SeverityLevel.HIGH
        elif priority_score >= 20.0 or risk_probability >= 0.35:
            severity = SeverityLevel.MEDIUM
        else:
            severity = SeverityLevel.LOW

        # Sort factors by weight descending
        contributing_factors.sort(key=lambda x: x.weight, reverse=True)

        return RiskExplanation(
            priority_score=priority_score,
            risk_probability=round(risk_probability, 3),
            impact_exposure=impact_exposure,
            urgency_factor=urgency_factor,
            severity=severity,
            model_version=self.model_version,
            contributing_factors=contributing_factors,
            recommended_action=recommended_action
        )
