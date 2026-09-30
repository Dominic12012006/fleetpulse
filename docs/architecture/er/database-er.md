# FleetPulse — Database Entity Relationship (ER) & Schema Specification

## 1. Relational 3NF Schema (PostgreSQL 16)

```mermaid
erDiagram
    TENANTS ||--o{ FLEETS : owns
    TENANTS ||--o{ USERS : employs
    TENANTS ||--o{ VEHICLES : manages
    TENANTS ||--o{ ALERTS : triggers
    TENANTS ||--o{ AUDIT_LOGS : records

    ROLES ||--o{ USERS : assigns

    FLEETS ||--o{ VEHICLES : groups
    
    VEHICLES ||--o{ DRIVERS : assigns
    VEHICLES ||--o{ TRIPS : logs
    VEHICLES ||--o{ ALERTS : experiences
    VEHICLES ||--o{ MAINTENANCE_ACTIONS : receives

    ALERTS ||--o{ MAINTENANCE_ACTIONS : resolves

    USERS ||--o{ MAINTENANCE_ACTIONS : schedules
    USERS ||--o{ AUDIT_LOGS : performs

    MODEL_VERSIONS ||--o{ ALERTS : scores

    TENANTS {
        uuid id PK
        string name
        string slug UK
        string status
        timestamptz created_at
        timestamptz updated_at
    }

    ROLES {
        string id PK
        string description
        jsonb permissions
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        string role_id FK
        string email UK
        string full_name
        string password_hash
        boolean is_active
        timestamptz created_at
    }

    FLEETS {
        uuid id PK
        uuid tenant_id FK
        string name
        string region
        timestamptz created_at
    }

    VEHICLES {
        uuid id PK
        uuid tenant_id FK
        uuid fleet_id FK
        string vin UK
        string license_plate
        string make
        string model
        int year
        string propulsion_type "ICE | EV | HYBRID"
        float odometer_km
        string status "ACTIVE | IN_SERVICE | GROUNDED"
        float current_risk_score
        string current_severity "LOW | MEDIUM | HIGH | CRITICAL"
        timestamptz last_telemetry_at
        timestamptz created_at
    }

    DRIVERS {
        uuid id PK
        uuid tenant_id FK
        uuid assigned_vehicle_id FK
        string full_name
        string license_number
        float safety_score
    }

    TRIPS {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        timestamptz start_time
        timestamptz end_time
        float distance_km
        float avg_speed_kmh
        int harsh_events_count
    }

    ALERTS {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        string model_version_id FK
        string alert_type
        string severity "LOW | MEDIUM | HIGH | CRITICAL"
        float priority_score
        float risk_probability
        float impact_exposure
        float urgency_factor
        jsonb contributing_factors
        string[] dtc_codes
        string status "OPEN | ACKNOWLEDGED | RESOLVED"
        uuid acknowledged_by FK
        timestamptz acknowledged_at
        timestamptz event_time
        timestamptz created_at
    }

    MAINTENANCE_ACTIONS {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid alert_id FK
        uuid scheduled_by FK
        string action_type "INSPECTION | OIL_CHANGE | BRAKE_SERVICE | BATTERY_REPLACEMENT"
        string status "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED"
        string priority "ROUTINE | URGENT | CRITICAL"
        text notes
        timestamptz scheduled_for
        timestamptz completed_at
        timestamptz created_at
    }

    MODEL_VERSIONS {
        string id PK
        string model_name
        string algorithm "GRADIENT_BOOSTING | DETERMINISTIC_BASELINE"
        float pr_auc
        float precision_score
        float recall_score
        boolean is_active
        timestamptz trained_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        jsonb details
        string ip_address
        timestamptz created_at
    }
```

---

## 2. Polyglot Store Schema Mapping

| Store | Collection / Table | Purpose & Structure |
| :--- | :--- | :--- |
| **PostgreSQL** | `vehicles`, `alerts`, `maintenance_actions`, `audit_logs` | Relational 3NF with foreign keys, compound indexes: `idx_vehicles_tenant_risk (tenant_id, current_risk_score DESC)`, `idx_alerts_tenant_status (tenant_id, status, severity)`. |
| **ClickHouse** | `telemetry_events` | Optimized columnar table with `ENGINE = MergeTree() PARTITION BY toYYYYMM(event_time) ORDER BY (tenant_id, vehicle_id, event_time)`. Includes `engine_temp`, `speed_kmh`, `soc_pct`, `odometer_km`, `lat`, `lon`, `dtc_codes`, timestamps. |
| **ClickHouse** | `hourly_vehicle_stats` | Pre-aggregated table with `ENGINE = SummingMergeTree()` for immediate fleet-wide charts without scanning raw ticks. |
| **MongoDB** | `raw_telemetry` | Stores raw BSON objects `{ "event_id": UUID, "oem": "OEM_A", "raw_payload": {...}, "ingest_time": ISODate }` with 30-day TTL index. |
| **MongoDB** | `quarantined_events` | Stores malformed or corrupted events rejected during schema normalization with failure reason. |
| **Redis** | `vehicle:{id}:latest` | Hash storing latest sensor values, current GPS coordinates, status, and latest priority score for instant frontend delivery. |
| **Redis** | `dedup:events:{event_id}` | String key with 3600-second TTL ensuring exactly-once processing across consumer replicas. |
