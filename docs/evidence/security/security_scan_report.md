# FleetPulse — Security Architecture & Vulnerability Scan Report

## Overview
This report documents the security audit, threat modeling (STRIDE), and vulnerability scans conducted on the FleetPulse backend, streaming gateways, and API services.

---

## 1. STRIDE Threat Model Assessment

| Threat Category | Ingestion Gateway & Telematics | Management API & Dashboard | Mitigations Implemented |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Rogue device transmitting spoofed GPS/VIN | Unauthorized user pretending to be fleet manager | mTLS device certificates, cryptographic JWT tokens with mandatory `tenant_id` verification. |
| **Tampering** | In-flight telemetry frame modification | Tampering with maintenance work orders | TLS 1.3 transit encryption, append-only PostgreSQL `audit_logs` table recording all mutations. |
| **Repudiation** | Driver/operator denying hazardous driving event | Dispatcher claiming work order was unconfirmed | Cryptographic sequence counters, immutable timestamp history, actor audit attribution. |
| **Information Disclosure** | Cross-tenant telemetry interception | Leaking customer routing and vehicle locations | Mandatory tenant isolation in database queries, PostgreSQL RLS policies, zero cross-tenant access. |
| **Denial of Service** | 300,000 EPS telemetry surge / broker flood | High-frequency API request spam | Kafka partition backpressure, Redis rate limiting (Token Bucket), async FastAPI architecture. |
| **Elevation of Privilege** | Technician executing administrative overrides | Unprivileged AI tool execution | Strict Role-Based Access Control (`require_role`), AI Copilot bounded by server-side tool allowlist. |

---

## 2. OWASP API Security Top 10 (2023) Coverage

| OWASP Vulnerability | Risk Description | FleetPulse Defence Implementation | Verification Status |
| :--- | :--- | :--- | :---: |
| **API1: Broken Object Level Auth** | Accessing vehicles of another tenant | Tenant scope validated cryptographically on every database query. | **VERIFIED** |
| **API2: Broken Authentication** | Token forgery or replay | Passwords hashed with Bcrypt (cost 12), JWT signed with HS256 and strict expiration. | **VERIFIED** |
| **API3: Broken Property Level Auth** | Mass assignment of admin fields | Strict Pydantic v2 DTO schemas with explicit validation boundaries. | **VERIFIED** |
| **API4: Unrestricted Resource Consumption** | API request starvation | Keyset pagination enforced, rate limits applied via Redis token buckets. | **VERIFIED** |
| **API5: Broken Function Level Auth** | Technicians scheduling root operations | `@require_role(["FLEET_MANAGER", "SUPER_ADMIN"])` enforced on state mutations. | **VERIFIED** |
| **API6: Server-Side Request Forgery** | External webhook injection | Zero unvalidated outbound URL calls; Copilot tools strictly allowlisted. | **VERIFIED** |
| **API7: Security Misconfiguration** | Unhandled stack traces / defaults | Standardized exception envelopes, no internal traces exposed to clients. | **VERIFIED** |
| **API8: Lack of Protection from Automated Threats** | Simulator spoof storm | Idempotent deduplication filter on Kafka consumer drops repeat frames. | **VERIFIED** |
| **API9: Improper Inventory Management** | Zombie or shadow API endpoints | Automated OpenAPI 3.1 specification generated dynamically from route tree. | **VERIFIED** |
| **API10: Unsafe Consumption of APIs** | Corrupted multi-OEM feeds | Unmapped or invalid OEM payloads quarantined to DLQ without crashing pipeline. | **VERIFIED** |

---

## 3. Static Code Analysis (SAST) Findings
- **Ruff Linter**: Zero critical syntax or lint violations detected.
- **Dependency Audit**: Python packages up to date, zero known CVEs in core dependencies (`pydantic>=2.6`, `fastapi`, `sqlalchemy>=2.0`).
- **Secret Scanning**: Zero hard-coded credentials committed; all connection URLs parameterized via `.env.example`.
