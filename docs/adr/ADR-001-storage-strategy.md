# ADR-001: Polyglot Storage Strategy for Connected Vehicle Telemetry

## Status
Accepted

## Context
FleetPulse must ingest 100,000+ events per second from connected vehicles across diverse fleets and OEMs. Telemetry data has fundamentally different access patterns from transactional business operations (fleet management, user roles, maintenance work orders, alert acknowledgments) and flexible OEM payload ingestion.

Using a single database engine for all concerns creates unresolvable trade-offs:
- An OLTP relational database (e.g., PostgreSQL) cannot cost-effectively sustain 100K+ write/sec time-series telemetry while executing complex analytical scans.
- An analytical columnar store (e.g., ClickHouse) lacks ACID transaction support and foreign-key referential integrity required for users, tenant boundaries, and audit logging.
- A pure document store (e.g., MongoDB) lacks the vectorized query execution speed needed for aggregating millions of sensor readings across temporal windows.

## Decision
We adopt a deliberate **Polyglot Storage Strategy** where each data store has a strictly segregated responsibility:

| Data Store | Primary Responsibility | Data Model / Schema | Consistency & Justification |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | Core Business Entities, Users, RBAC, Fleets, Vehicles, Alerts, Maintenance Actions, Audit Logs | 3NF Relational Schema with foreign keys, composite indexes, JSONB for metadata | **Strong Consistency (ACID)**. Guarantees zero data loss for work orders, user permissions, multi-tenant boundaries, and compliance audit logs. |
| **ClickHouse** | High-velocity Telemetry History, Sliding Window Aggregates, Fleet-wide Metrics | Partitioned columnar `MergeTree` engines sorted by `(tenant_id, vehicle_id, event_time)` | **Eventual Consistency / Vectorized Analytics**. Unbeatable compression ratio (3-5x) and sub-second analytical scans over tens of millions of records. |
| **MongoDB** | Raw OEM Telemetry Payloads & Schema Variations | Flexible BSON Document Collections (`raw_telemetry`, `quarantined_events`) | **Document Storage**. Retains pristine source payloads across unknown/evolving OEM formats for traceability, re-parsing, and debugging. |
| **Redis 7 (Alpine)** | Hot Vehicle State, Real-time Counters, Alert Deduplication, Rate Limiting | In-memory key-value, hashes, sorted sets with TTL | **Sub-millisecond In-Memory**. Serves live dashboard requests and streaming deduplication filters without touching disks. |
| **MinIO / S3** | Cold Parquet Storage, Historical Replay, Model Training Batches | Compressed Apache Parquet partitioned by `tenant_id/year/month/day` | **Durable Cold Object Storage**. Low cost, infinite retention, and cloud-native batch ML training. |

## Consequences
- **Positive**: Each database operates within its optimal performance envelope; write throughput of 100K+ events/sec is handled effortlessly by Kafka/ClickHouse without impacting relational transaction performance.
- **Negative**: Increased operational complexity in deployment and synchronization; mitigated by containerized infrastructure (Docker Compose / Helm) and clean hexagonal repository boundaries.
