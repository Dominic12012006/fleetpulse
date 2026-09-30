# FleetPulse — MoSCoW Feature Traceability Matrix

## 1. Traceability Summary

This matrix maps every hackathon requirement to its architectural tier, implemented component, and automated verification test.

| Tier | Feature Description | Component / Service | Implementation Path | Verification & Test Evidence |
| :---: | :--- | :--- | :--- | :--- |
| **Must (P0)** | 100K+ Synthetic Vehicle Simulation | `apps/simulator` | `apps/simulator/generator.py` | `tests/unit/test_simulator.py::test_fleet_generator_deterministic_count` |
| **Must (P0)** | Real-Time Telemetry Stream Ingestion | `services/stream_processor` | `services/stream_processor/processor.py` | `tests/performance/benchmark_load.py` (Report: `docs/evidence/load-test/`) |
| **Must (P0)** | Dynamic Risk-to-Impact Queue | `apps/web` & `apps/api` | `apps/web/src/components/RiskQueue.tsx` | `tests/integration/test_api.py::test_alerts_lifecycle` |
| **Must (P0)** | Interactive Fleet Geo-Map | `apps/web` | `apps/web/src/components/FleetMap.tsx` | Visual verification & node density tests |
| **Must (P0)** | Vehicle Intelligence & Diagnostic Timeline | `apps/web` & `apps/api` | `apps/web/src/components/VehicleDetail.tsx` | `tests/integration/test_api.py::test_vehicles_listing_and_detail` |
| **Must (P0)** | Alert Acknowledgment & State Machine | `apps/api` | `apps/api/routers/alerts.py` | `tests/integration/test_api.py::test_alerts_lifecycle` |
| **Must (P0)** | Real-Time System Health Pulse | `apps/web` & `apps/api` | `apps/web/src/components/KPICards.tsx` | `tests/integration/test_api.py::test_health_and_metrics` |
| **Should (P1)** | Tabular Predictive ML Model | `services/risk_engine` | `services/risk_engine/ml_model.py` | `docs/evidence/ml/model_evaluation_report.md` |
| **Should (P1)** | Explainable Contributing Factors ($P \times I \times U$) | `services/risk_engine` | `services/risk_engine/engine.py` | `tests/unit/test_stream_and_risk.py::test_baseline_risk_engine_critical_thermal` |
| **Should (P1)** | Historical Analytics & Lead-Time Metrics | `apps/api` & `ClickHouse` | `apps/api/routers/analytics.py` | `apps/web/src/components/AnalyticsView.tsx` |
| **Should (P1)** | Multi-Tenant RBAC & Isolation | `apps/api` | `apps/api/core/dependencies.py` | `tests/integration/test_api.py::test_auth_login` |
| **Should (P1)** | Tamper-Proof Audit Logging | `apps/api` & `PostgreSQL` | `apps/api/routers/audit.py` | `apps/web/src/components/AuditView.tsx` |
| **Should (P1)** | Chaos Resilience & Broker Outage Recovery | Ingestion & Streaming | `tests/chaos/chaos_resilience.py` | `docs/evidence/chaos/chaos_report.md` (0 data loss) |
| **Could (P2)** | Bounded AI Fleet Copilot with Allowlisted Tools | `apps/api` & `apps/web` | `apps/api/routers/copilot.py` | `tests/integration/test_api.py::test_copilot_query` |
| **Could (P2)** | One-Click Scenario Injection Lab | `apps/api` & `apps/web` | `apps/web/src/components/ScenarioBar.tsx` | `tests/integration/test_api.py::test_scenario_injection` |
| **Could (P2)** | Multi-OEM Normalizer (OEM-A, OEM-B, OEM-C) | `services/normalizer` | `services/normalizer/normalizer.py` | `tests/unit/test_schemas.py::test_oem_*_normalization` |
| **Future (P3)** | Automated Route Optimization | Future Expansion | Roadmapped for v2.0 | N/A |
| **Future (P3)** | Autonomous EV Battery Swapping Network | Future Expansion | Roadmapped for v2.0 | N/A |
