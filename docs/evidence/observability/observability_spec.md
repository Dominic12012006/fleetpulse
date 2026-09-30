# FleetPulse — Observability & Distributed Monitoring Specification

## Overview
FleetPulse integrates OpenTelemetry, Prometheus, and Grafana to provide full-stack observability across the streaming ingestion, ML inference, and API serving paths.

---

## 1. Metrics Catalog & Prometheus Identifiers

| Metric Name | Type | Unit | Description |
| :--- | :---: | :---: | :--- |
| `events_in_per_second` | Counter / Rate | events/s | Real-time rate of telemetry frames received at the ingestion gateway |
| `events_processed_per_second` | Counter / Rate | events/s | Real-time processing throughput through Flink streaming windows |
| `kafka_consumer_lag` | Gauge | messages | Unconsumed message lag across partitions on `telemetry.raw` |
| `duplicate_event_count` | Counter | count | Cumulative duplicate events filtered by idempotent deduplication |
| `late_event_count` | Counter | count | Out-of-order events arriving outside the 5-second watermark boundary |
| `quarantined_event_count` | Counter | count | Malformed or unsupported OEM frames routed to quarantine DLQ |
| `api_request_duration_seconds` | Histogram | seconds | HTTP request latency distribution across API endpoints (p50, p95, p99) |
| `api_requests_total` | Counter | count | Total API HTTP requests grouped by method, endpoint, and status code |
| `model_inference_latency_ms` | Histogram | ms | Execution duration of tabular predictive risk model inference |
| `redis_hit_ratio` | Gauge | ratio [0-1] | Cache hit ratio for hot vehicle state and deduplication checks |

---

## 2. Grafana Dashboard Layouts

### Dashboard 1: Executive Command & System Health
- **Row 1**: Stat panels for Ingestion Rate (`events_in_per_second`), Active Connected Vehicles, Critical Open Alerts, and p95 End-to-End Latency.
- **Row 2**: Time-series graph of Real-Time Throughput vs. Kafka Buffer Lag.
- **Row 3**: Single-value gauge for System SLA Health Pulse (Target: `>99.9%`).

### Dashboard 2: Streaming Engine & Watermarking Topology
- **Row 1**: Flink Watermark Progression vs. Event Time Clock.
- **Row 2**: Deduplication Filter Drop Rate (`duplicate_event_count`) and Late Event Counters.
- **Row 3**: Multi-OEM Normalization Breakdown (OEM_A, OEM_B, OEM_C, Quarantined DLQ).

### Dashboard 3: Machine Learning & Decision Accuracy
- **Row 1**: Active Inference Model Version (`v1.1-gradient-boost`).
- **Row 2**: Model PR-AUC (`0.9967`) vs. Baseline PR-AUC (`0.9474`).
- **Row 3**: Top Contributing Signals Distribution (Coolant climb, misfire DTCs, harsh braking).

---

## 3. Prometheus Scrape Configuration
The API exposes standard OpenMetrics at `GET /metrics` (`http://localhost:8000/metrics`) scraped by Prometheus every 5 seconds.
