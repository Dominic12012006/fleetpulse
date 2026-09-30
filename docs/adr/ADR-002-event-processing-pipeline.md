# ADR-002: Real-Time Event Processing Architecture & Watermarking

## Status
Accepted

## Context
Connected vehicles operate in real-world cellular and satellite environments prone to dead zones, delayed batching, network retransmissions, clock drift, and bursts during peak commute hours. Telemetry events arrive:
1. **Out-of-order**: Vehicles queue readings during connectivity drops and flush them retroactively.
2. **Duplicate**: Network retries deliver identical sensor frames multiple times.
3. **Bursty**: Traffic surges up to 3× nominal rates (300,000 events/sec) for short durations.

Processing this volume naively leads to corrupted window aggregates, false positive alarms, and backpressure collapse.

## Decision
We implement a decoupled **Streaming Processing Pipeline** adhering to event-time semantics:

1. **Ingestion & Buffering (Kafka / Redpanda)**:
   - Topic `telemetry.raw`: Partitioned by `tenant_id:vehicle_id` ensuring per-vehicle ordering.
   - Buffer absorbency: Handles 3× bursts effortlessly with consumer backpressure.
   - Quarantine topic `telemetry.quarantine`: Captures malformed or unsupported OEM payloads for DLQ inspection.

2. **Normalisation (Multi-OEM Adapters)**:
   - Dedicated stateless workers parse OEM-A, OEM-B, OEM-C payloads into a typed, versioned `CanonicalTelemetryEvent`.
   - Assigns `ingest_time` while preserving source `event_time`.

3. **Stream Processing (Flink Semantics)**:
   - **Event-Time Watermarking**: Bounded out-of-orderness watermarks (5-second grace window) allow delayed events to be correctly ordered into tumbling and sliding windows.
   - **Idempotent Deduplication**: Two-tier deduplication filter (local LRU memory cache + Redis Bloom/hash check on `event_id`) with 1-hour expiration.
   - **Sliding Windows**: Computes rolling metrics:
     - 1-minute engine temperature velocity ($\Delta T / \Delta t$)
     - 5-minute harsh braking and acceleration count
     - 15-minute battery state-of-charge degradation rate
   - **Hot State Materialization**: Writes latest vehicle telemetry to Redis `vehicle:{id}:latest` and emits detected risk indicators to `alerts.live`.

## Consequences
- **Positive**: Complete resistance to network jitter, zero duplicate alert spam, accurate temporal aggregations.
- **Negative**: Out-of-order events arriving later than the watermark tolerance are routed to cold path analytics and marked as late events.
