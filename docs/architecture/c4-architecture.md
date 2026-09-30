# FleetPulse — C4 Architecture Specification

## 1. System Context Diagram (C4 Level 1)

```mermaid
flowchart TD
    subgraph Users
        FM["Fleet Manager<br/>[Primary User]<br/>Monitors fleet health, prioritizes high-risk vehicles, schedules maintenance"]
        Tech["Technician / Mechanic<br/>[User]<br/>Inspects vehicle diagnostics, completes work orders"]
        Auditor["Compliance Auditor<br/>[User]<br/>Reviews safety logs, SLA adherence, and AI actions"]
    end

    subgraph FleetPulseSystem["FleetPulse Platform"]
        FP["FleetPulse Connected Vehicle Intelligence Platform<br/>Ingests 100K+ events/sec, detects anomalies, evaluates predictive risk, and visualizes real-time command state"]
    end

    subgraph ExternalSystems["External Entities & Fleet Ecosystem"]
        Vehicles["Connected Vehicles (100K+ Fleet)<br/>[Mixed ICE & EV]<br/>Emits real-time telemetry, DTCs, location, and sensor frames"]
        OEM_Cloud["OEM Telematics Clouds<br/>[Proprietary API / Webhook]<br/>Provides heterogeneous vehicle telemetry feeds"]
        ExtMaintenance["Maintenance Work Order System / ERP<br/>[External Service]<br/>Receives confirmed scheduled repair orders"]
    end

    Vehicles -->|MQTT / mTLS Telemetry| FP
    OEM_Cloud -->|HTTPS REST Webhooks| FP
    FM -->|HTTPS / WSS Command Centre UI| FP
    Tech -->|HTTPS Mobile / Diagnostic View| FP
    Auditor -->|HTTPS Compliance Audit Query| FP
    FP -->|Work Order Sync API| ExtMaintenance
```

---

## 2. Container Diagram (C4 Level 2)

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier"]
        UI["FleetPulse Web Application<br/>[React 18, TypeScript, Tailwind, Framer Motion, ECharts, MapLibre]<br/>Displays real-time map, prioritized risk queue, vehicle intelligence drill-down, and live metrics"]
    end

    subgraph IngestionTier["Edge & Ingestion Tier"]
        Sim["Fleet Simulator<br/>[Python / AsyncIO]<br/>Simulates 100,000+ realistic ICE/EV vehicles, trips, faults, duplicates & 3x bursts"]
        Ingress["Ingestion Gateway<br/>[FastAPI / MQTT Broker]<br/>Validates device auth, mTLS, rate limiting, and publishes to Kafka"]
    end

    subgraph MessagingTier["Streaming & Message Broker Tier"]
        KafkaRaw["Kafka: telemetry.raw<br/>[Topic, Partitioned by vehicle_id]"]
        KafkaCanonical["Kafka: telemetry.canonical<br/>[Topic, Validated Canonical Events]"]
        KafkaAlerts["Kafka: alerts.live<br/>[Topic, Real-time Risk Events]"]
        KafkaDLQ["Kafka: telemetry.quarantine<br/>[Topic, Corrupt/Unknown OEM DLQ]"]
    end

    subgraph ProcessingTier["Processing & ML Tier"]
        Normalizer["Multi-OEM Normalizer<br/>[Python Service]<br/>Maps OEM-A, OEM-B, OEM-C payloads into Canonical Event contracts"]
        StreamProc["Stream Processor (Flink Semantics)<br/>[Event-time Engine]<br/>Watermarks, deduplication, sliding-window features (1m, 5m, 15m)"]
        RiskEngine["Predictive Risk Engine<br/>[Scikit-Learn / Baseline Engine]<br/>Evaluates Risk = Probability x Exposure x Urgency with explainable factors"]
    end

    subgraph PolyglotStorage["Polyglot Storage Tier"]
        PG[("PostgreSQL 16<br/>[OLTP Core]<br/>3NF schema: Tenants, Fleets, Vehicles, Alerts, Work Orders, Audit Logs")]
        CH[("ClickHouse<br/>[Columnar OLAP]<br/>High-velocity telemetry time-series, partition-pruned historical queries")]
        Mongo[("MongoDB<br/>[Raw Document Store]<br/>Unstructured original OEM payloads, quarantine audit documents")]
        Redis[("Redis 7 Alpine<br/>[In-Memory Cache & Hot State]<br/>Latest vehicle state, sliding deduplication keys, hot counters")]
        S3[("MinIO / S3<br/>[Cold Object Store]<br/>Parquet historical partitions for long-term analytics & ML replay")]
    end

    subgraph APITier["Backend & Gateway Tier"]
        API["FleetPulse Backend API<br/>[FastAPI, Asyncpg, Python]<br/>Clean architecture, OpenAPI, RBAC, Keyset pagination, and WebSocket live push"]
        Copilot["Fleet Copilot<br/>[Bounded AI Gateway]<br/>Allowlisted read-only fleet tools + confirmed write operations + audit log"]
    end

    Sim -->|Simulated Telemetry| Ingress
    Ingress -->|Raw Payload| KafkaRaw
    KafkaRaw --> Normalizer
    Normalizer -->|Canonical Events| KafkaCanonical
    Normalizer -->|Unknown/Malformed| KafkaDLQ
    Normalizer -->|Archive Raw BSON| Mongo

    KafkaCanonical --> StreamProc
    StreamProc -->|Deduplication Check & Cache| Redis
    StreamProc -->|Batch Insert Telemetry| CH
    StreamProc -->|Cold Path Parquet| S3
    StreamProc -->|Windowed Features| RiskEngine

    RiskEngine -->|High-Risk Alerts| KafkaAlerts
    RiskEngine -->|Alert Records & Status| PG
    KafkaAlerts --> API

    API -->|Query Metadata & RBAC| PG
    API -->|Fetch Historical Time-Series| CH
    API -->|Fetch Hot Vehicle State| Redis
    API -->|Live Telemetry & Alerts via WSS| UI
    UI -->|REST Operations & Actions| API
    API --> Copilot
    Copilot -->|Allowlisted Read Queries| API
```

---

## 3. Deployment Diagram (C4 Level 3 — Docker Compose & Cloud Kubernetes)

```mermaid
flowchart LR
    subgraph Host["Docker Host / Kubernetes Cluster"]
        subgraph NetApp["fleetpulse-network (Bridge / CNI)"]
            cWeb["container: fleetpulse-web<br/>Port 3000 (React Vite SPA)"]
            cAPI["container: fleetpulse-api<br/>Port 8000 (FastAPI Core)"]
            cSim["container: fleetpulse-simulator<br/>(100K Vehicle Generator)"]
            cStream["container: fleetpulse-stream<br/>(Flink Event-Time Processor)"]
            cRisk["container: fleetpulse-risk<br/>(Risk & Anomaly Engine)"]
        end

        subgraph NetData["fleetpulse-data"]
            cKafka["container: kafka / redpanda<br/>Ports 9092, 9094"]
            cPG["container: postgres<br/>Port 5432 (PostgreSQL 16)"]
            cCH["container: clickhouse<br/>Ports 8123 (HTTP), 9000 (Native)"]
            cMongo["container: mongodb<br/>Port 27017"]
            cRedis["container: redis<br/>Port 6379 (Redis 7)"]
            cMinIO["container: minio<br/>Ports 9000, 9001"]
        end

        subgraph NetObs["fleetpulse-obs"]
            cProm["container: prometheus<br/>Port 9090"]
            cGraf["container: grafana<br/>Port 3001"]
        end
    end

    cWeb --> cAPI
    cAPI --> cPG
    cAPI --> cCH
    cAPI --> cRedis
    cAPI --> cKafka
    cSim --> cKafka
    cStream --> cKafka
    cStream --> cRedis
    cStream --> cCH
    cRisk --> cKafka
    cRisk --> cPG
    cProm --> cAPI
    cProm --> cKafka
    cGraf --> cProm
```
