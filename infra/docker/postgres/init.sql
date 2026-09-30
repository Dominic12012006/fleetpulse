-- FleetPulse PostgreSQL 16 3NF Relational Schema
-- Supports Tenants, Users, RBAC, Fleets, Vehicles, Drivers, Trips, Alerts, Maintenance Actions, and Audit Logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO roles (id, description, permissions) VALUES
('SUPER_ADMIN', 'Global administrator with complete platform access', '["all"]'::jsonb),
('FLEET_MANAGER', 'Fleet operations manager: alerts, dispatch, maintenance scheduling', '["fleet:read", "fleet:write", "alerts:ack", "maintenance:write", "copilot:use"]'::jsonb),
('TECHNICIAN', 'Service bay technician: inspection, repairs, maintenance completion', '["fleet:read", "maintenance:complete", "telemetry:read"]'::jsonb),
('AUDITOR', 'Compliance auditor: read-only access to audit logs and metrics', '["audit:read", "metrics:read"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- 4. Fleets
CREATE TABLE IF NOT EXISTS fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleets_tenant ON fleets(tenant_id);

-- 5. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
    vin VARCHAR(17) UNIQUE NOT NULL,
    license_plate VARCHAR(50) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    propulsion_type VARCHAR(20) NOT NULL DEFAULT 'ICE',
    odometer_km NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    current_risk_score NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    current_severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    active_dtcs TEXT[] NOT NULL DEFAULT '{}',
    lat NUMERIC(9, 6) NOT NULL DEFAULT 0.0,
    lon NUMERIC(9, 6) NOT NULL DEFAULT 0.0,
    speed_kmh NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    soc_pct NUMERIC(5, 1),
    engine_temp_c NUMERIC(5, 1),
    last_telemetry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_risk ON vehicles(tenant_id, current_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_severity ON vehicles(tenant_id, current_severity);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- 6. Model Versions
CREATE TABLE IF NOT EXISTS model_versions (
    id VARCHAR(100) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    pr_auc NUMERIC(5, 4),
    precision_score NUMERIC(5, 4),
    recall_score NUMERIC(5, 4),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO model_versions (id, model_name, algorithm, pr_auc, precision_score, recall_score, is_active) VALUES
('v1.0-baseline', 'Deterministic Physics & DTC Baseline', 'RULE_ENGINE', 0.8250, 0.8100, 0.8400, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    model_version_id VARCHAR(100) REFERENCES model_versions(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    priority_score NUMERIC(5, 1) NOT NULL,
    risk_probability NUMERIC(4, 3) NOT NULL,
    impact_exposure NUMERIC(4, 2) NOT NULL,
    urgency_factor NUMERIC(3, 1) NOT NULL,
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    dtc_codes TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    event_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_status_sev ON alerts(tenant_id, status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle ON alerts(vehicle_id);

-- 8. Maintenance Actions
CREATE TABLE IF NOT EXISTS maintenance_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    scheduled_by UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    priority VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    notes TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_status ON maintenance_actions(tenant_id, status);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);

-- Seed Default Tenant and Initial Fleet Manager User
INSERT INTO tenants (id, name, slug) VALUES
('e2b10a24-1f33-4f24-9df2-5c8e44123456', 'Global Logistics Corp', 'global-logistics')
ON CONFLICT (slug) DO NOTHING;

-- Seed Admin (Password: 'FleetPulse2026!')
INSERT INTO users (id, tenant_id, role_id, email, full_name, password_hash) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'e2b10a24-1f33-4f24-9df2-5c8e44123456', 'FLEET_MANAGER', 'manager@fleetpulse.io', 'Dominic Fleet Manager', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
ON CONFLICT (email) DO NOTHING;
