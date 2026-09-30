# ADR-005: Observability, Distributed Tracing, and SLA Measurement

## Status
Accepted

## Context
The hackathon specification establishes non-negotiable performance targets:
- Sustain 100,000+ events/sec ingestion and processing.
- Absorb 3× traffic bursts (300,000 events/sec) for 5 minutes without data loss.
- End-to-end dashboard update latency under 2.0 seconds.
- Critical alert detection latency under 5.0 seconds.
- API p95 latency under 200 ms, p99 under 500 ms.
- Zero silent drops during broker or service failure.

These SLAs cannot be demonstrated through static code alone; they require continuous instrumentation across the distributed pipeline.

## Decision
1. **Timestamp Propagation Pipeline**:
   Every telemetry event carries structured timestamps across its lifecycle:
   - `event_time`: Vehicle sensor generation time.
   - `ingest_time`: Ingestion gateway receipt timestamp.
   - `processing_time`: Stream processor window / feature computation timestamp.
   - `persistence_time`: Storage commit timestamp.
   - `publish_time`: WebSocket/SSE broadcast timestamp.
   - `receive_time`: Browser receipt timestamp recorded on the client.
   
   End-to-end latency is calculated directly per event ID:
   $$\text{DashboardLatency} = \text{receive\_time} - \text{event\_time}$$
   $$\text{AlertLatency} = \text{publish\_time} - \text{event\_time}$$

2. **OpenTelemetry & Prometheus Metrics**:
   - Ingestion throughput: `events_in_per_second`
   - Stream throughput: `events_processed_per_second`
   - Consumer lag: `kafka_consumer_lag` by topic & partition
   - Stream anomalies: `duplicate_event_count`, `late_event_count`, `quarantined_event_count`
   - Latencies: `stream_processing_latency_ms`, `alert_detection_latency_ms`, `api_request_duration_seconds`
   - Memory & CPU: `service_cpu_utilization`, `service_memory_bytes`

3. **Grafana Dashboards**:
   - **Executive Command Dashboard**: Ingestion rate, active vehicles, active critical alerts, p95 end-to-end latency, health pulse.
   - **Streaming Topology Dashboard**: Kafka partition lag, Flink window watermarks, buffer utilization, DLQ count.
   - **API & Storage Health**: RPS, error rate (4xx/5xx), ClickHouse insert batch latency, PostgreSQL connection pool metrics.

## Consequences
- **Positive**: Every performance claim is mathematically verified and provable with timestamp evidence.
- **Negative**: Adds 32 bytes of timestamp metadata per event, well within bandwidth and memory budgets.
