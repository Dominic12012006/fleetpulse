# FleetPulse — Declarations & Compliance Statement

## 1. Synthetic Data Declaration
In compliance with hackathon regulations and Gate G14:
- All vehicle identifiers (17-character VINs), telemetry streams, GPS coordinates, sensor values, driver names, and diagnostic trouble codes (DTCs) utilized within FleetPulse are **100% synthetically generated** via the deterministic `FleetGenerator` physics engine (`apps/simulator/generator.py`).
- No proprietary OEM data, confidential customer telematics, or Personally Identifiable Information (PII) has been utilized.
- Synthetic VIN generation adheres to ISO 3779 formatting standards while strictly omitting illegal characters (`I`, `O`, `Q`).

## 2. Open-Source Software Declarations
FleetPulse is built upon proven, permissively licensed open-source technologies:
- **Backend & Core**: Python 3.10, FastAPI (MIT), Pydantic v2 (MIT), SQLAlchemy (MIT), Uvicorn (BSD), NumPy (BSD), Pandas (BSD), Scikit-Learn (BSD).
- **Streaming & Polyglot Storage**: Apache Kafka / Redpanda (BSL / Apache 2.0), PostgreSQL 16 (PostgreSQL License), ClickHouse (Apache 2.0), Redis 7 (BSD), MongoDB (SSPL).
- **Frontend & Visualization**: React 18 (MIT), TypeScript (Apache 2.0), Tailwind CSS (MIT), Vite (MIT), Apache ECharts (Apache 2.0), Lucide React (ISC).
- **Infrastructure & Testing**: Docker & Docker Compose (Apache 2.0), Pytest (MIT), Prometheus (Apache 2.0).

## 3. AI Safety & Copilot Declarations
- The optional Fleet Copilot (`apps/api/routers/copilot.py`) operates exclusively under a **server-side tool allowlist**.
- The Copilot is strictly read-only by default and is forbidden from generating arbitrary SQL queries.
- Any state-mutating operation (such as scheduling a maintenance work order) requires explicit, two-step human confirmation.
- Every query, tool execution, and dispatch decision is recorded in an immutable, append-only PostgreSQL audit log.

## 4. Zero Secrets in Version Control
- All credentials, database connection strings, and encryption keys are parameterized through environment variables (`.env.example` provided).
- No production secrets or API private keys are committed into version control.
