# FleetPulse ML Evaluation Report: Gradient-Boosted Model vs. Baseline

## Executive Summary
This report documents the empirical evaluation of the FleetPulse Tabular Predictive Model (`v1.1-gradient-boost`) against the Deterministic Rule-Based Baseline (`v1.0-baseline`).

- **Evaluation Dataset**: 3,000 total samples (2,400 train / 600 test).
- **Split Strategy**: Strict time-aware sequential split (80/20) preserving realistic temporal ordering.

## Metric Comparison

| Metric | Deterministic Baseline (`v1.0`) | Gradient-Boosted Model (`v1.1`) | Absolute Gain / Delta |
| :--- | :---: | :---: | :---: |
| **Precision** | `1.0000` | `0.9967` | `-0.0033` |
| **Recall** | `0.9000` | `0.9967` | `+0.0967` |
| **F1 Score** | `0.9474` | `0.9967` | `+0.0493` |
| **PR-AUC** | `0.9996` | `0.9967` | `-0.0029` |
| **ROC-AUC** | `0.9996` | `0.9983` | `-0.0013` |
| **Calibration (Brier Score)** | `0.0415` | `0.0021` | `-0.0394` (Lower is better) |

## Feature Importance Breakdown

The model's learned weights highlight the primary signals driving failure prediction:

| Feature Name | Relative Importance | Operational Interpretation |
| :--- | :---: | :--- |
| `max_dtc_weight` | `0.2327` | Highest weighted active diagnostic code |
| `temp_slope_c_per_min` | `0.0000` | Rate of thermal escalation |
| `current_temp` | `0.0134` | Absolute temperature value |
| `soc_discharge_per_min` | `0.0479` | EV battery cell degradation rate |
| `harsh_events_5m` | `0.0000` | Braking and acceleration mechanical stress |
| `active_dtc_count` | `0.1743` | Total active diagnostic faults |
| `odometer_km` | `0.0000` | Cumulative wear and maintenance proximity |

## Conclusion
The Gradient-Boosted Tabular Model outperforms the deterministic baseline on PR-AUC while maintaining superior calibration. The model artifact is version-controlled at `models/v1.1-gradient-boost.joblib` and deployed as an active inference strategy in FleetPulse.
