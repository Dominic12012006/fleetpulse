-- FleetPulse ClickHouse Analytical Telemetry Schema

CREATE DATABASE IF NOT EXISTS fleetpulse;

-- 1. High-Velocity Raw Telemetry Events Table
CREATE TABLE IF NOT EXISTS fleetpulse.telemetry_events (
    event_id UUID,
    vehicle_id UUID,
    vin LowCardinality(String),
    tenant_id UUID,
    event_time DateTime64(3, 'UTC'),
    ingest_time DateTime64(3, 'UTC'),
    sequence_no UInt64,
    oem LowCardinality(String),
    lat Float64,
    lon Float64,
    speed_kmh Float32,
    heading_deg Float32,
    odometer_km Float64,
    propulsion_type LowCardinality(String),
    engine_temp_c Nullable(Float32),
    battery_temp_c Nullable(Float32),
    soc_pct Nullable(Float32),
    fuel_pct Nullable(Float32),
    oil_pressure_kpa Nullable(Float32),
    battery_voltage Nullable(Float32),
    dtc_codes Array(String),
    event_type LowCardinality(String),
    is_anomaly UInt8
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (tenant_id, vehicle_id, event_time)
SETTINGS index_granularity = 8192;

-- 2. Hourly Pre-aggregated Statistics Table (SummingMergeTree)
CREATE TABLE IF NOT EXISTS fleetpulse.hourly_vehicle_stats (
    tenant_id UUID,
    vehicle_id UUID,
    event_hour DateTime('UTC'),
    event_count UInt64,
    total_distance_km Float64,
    max_speed_kmh Float32,
    avg_speed_sum Float64,
    max_engine_temp Float32,
    harsh_events_count UInt32,
    anomaly_count UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(event_hour)
ORDER BY (tenant_id, vehicle_id, event_hour);

-- 3. Materialized View to automatically aggregate raw stream into hourly table
CREATE MATERIALIZED VIEW IF NOT EXISTS fleetpulse.mv_hourly_vehicle_stats
TO fleetpulse.hourly_vehicle_stats AS
SELECT
    tenant_id,
    vehicle_id,
    toStartOfHour(event_time) AS event_hour,
    count() AS event_count,
    max(odometer_km) - min(odometer_km) AS total_distance_km,
    max(speed_kmh) AS max_speed_kmh,
    sum(speed_kmh) AS avg_speed_sum,
    max(engine_temp_c) AS max_engine_temp,
    countIf(event_type IN ('HARSH_BRAKE', 'HARSH_ACCEL')) AS harsh_events_count,
    countIf(is_anomaly = 1) AS anomaly_count
FROM fleetpulse.telemetry_events
GROUP BY tenant_id, vehicle_id, event_hour;
