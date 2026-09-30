# ADR-004: Multi-Tenant Isolation, RBAC, and Security Architecture

## Status
Accepted

## Context
FleetPulse operates in an enterprise multi-tenant fleet environment where logistics companies, municipal transit authorities, and commercial delivery fleets share the same platform infrastructure. Strict requirements dictate:
1. Zero cross-tenant data leakage under any circumstance.
2. Fine-grained Role-Based Access Control (RBAC) separating administrative actions from routine dispatcher tasks.
3. Cryptographic integrity and tamper-proof audit trails for all operations (work order scheduling, alert overrides, and AI tool calls).

## Decision
1. **Tenant Isolation Model**:
   - **Database Level**: Shared schema with mandatory `tenant_id: UUID` row-level tenancy enforced in application repositories and verified via PostgreSQL Row Level Security (RLS) policies.
   - **Kafka Level**: Telemetry topics include `tenant_id` in headers and key prefixes (`{tenant_id}:{vehicle_id}`).
   - **API Layer**: Tenant context is extracted cryptographically from verified JWT claims by FastAPI dependency injection (`get_current_tenant`). Cross-tenant access attempts immediately trigger a security audit event and return HTTP 403 Forbidden.

2. **Role-Based Access Control (RBAC)**:
   | Role | Permissions |
   | :--- | :--- |
   | `SUPER_ADMIN` | Tenant lifecycle, system configuration, global metrics |
   | `FLEET_MANAGER` | View fleet, triage alerts, acknowledge alerts, schedule maintenance actions, use Fleet Copilot |
   | `TECHNICIAN` | Inspect vehicle diagnostics, mark maintenance actions completed, view telemetry timeline |
   | `AUDITOR` | Read-only access to audit logs, compliance reports, and model metrics |

3. **Tamper-Evident Audit Logging**:
   - Every mutation (acknowledging an alert, creating a maintenance order, modifying vehicle status, or running an AI copilot query) is committed in an append-only PostgreSQL `audit_logs` table containing `actor_id`, `tenant_id`, `action`, `resource_id`, `ip_address`, `timestamp`, and state diff.

4. **Network & Device Security**:
   - Ingestion endpoints enforce TLS in transit. Simulated device connections pass through mutual authentication (mTLS) or cryptographically signed device tokens.
   - Secrets are managed exclusively via environment variables (`.env.example` template only; zero secrets checked into Git).

## Consequences
- **Positive**: Compliant with enterprise security standards, protects proprietary operational data, prevents privilege escalation.
- **Negative**: Adds validation overhead on all database transactions, fully covered by automated cross-tenant security test suites.
