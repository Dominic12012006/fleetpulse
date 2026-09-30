# FleetPulse — 5-Minute Video Demonstration Script

## Overview
This script outlines the exact timing, actions, and talking points for the ≤5:00 minute recorded product demonstration.

---

### Segment 1: Operational Problem & Fleet Scale (0:00 – 0:35)
- **Visual**: FleetPulse Command Centre on browser (`http://localhost:3000`). KPI strip, live map showing plotted vehicle hubs, and real-time streaming indicator (104.5k EPS | 12ms).
- **Spoken**:
  > "Welcome to FleetPulse. In enterprise connected fleet operations, managing 100,000+ vehicles generates hundreds of thousands of sensor readings every second. Traditional telematics bombard dispatchers with raw diagnostic trouble codes and threshold noise, causing alert fatigue.
  > FleetPulse continuously converts high-velocity vehicle telemetry into explainable maintenance risk and business-impact priorities, so fleet managers know which vehicles need attention first and why."

---

### Segment 2: Real-Time Command Centre Overview (0:35 – 0:55)
- **Visual**: Point to KPI cards, interactive Geo-telemetry map, and the Prioritized Risk Queue. Filter vehicles by 'Critical Only' and 'Electric Vehicles'.
- **Spoken**:
  > "Here in the Command Centre, we monitor our 100,000-vehicle fleet in real time across our global transit corridors. Rather than raw counts, our queue is ordered by **Priority = Probability × Exposure × Urgency**. Notice the live telemetry ticker in the header: our Kafka and Flink streaming ingestion pipeline is sustaining over 100,000 events per second at a sub-20 millisecond p95 latency."

---

### Segment 3: Live Fault Injection & Anomaly Detection (0:55 – 1:45)
- **Visual**: Click "Scenario Lab" button on the navbar. Select **"Thermal Overheat"** or **"Brake System Stress"**.
- **Spoken**:
  > "Let's demonstrate our real-time streaming pipeline by injecting an active failure scenario. We select 'Thermal Overheat'.
  > Immediately, the simulator triggers a coolant thermostat failure. The raw telemetry passes through our multi-OEM normalizer, where Flink event-time windowing computes a severe thermal rate of climb of plus 1.6 degrees per minute.
  > Without refreshing the browser, the WebSocket stream broadcasts the updated risk state, and the target vehicle jumps straight to the top of our Risk Queue with a Critical priority score."

---

### Segment 4: Vehicle Intelligence & Explainability Drill-Down (1:45 – 2:25)
- **Visual**: Click the top vehicle to enter the **Vehicle Intelligence View**. Show real-time gauges, the 15-minute diagnostic ECharts timeline, and the Explainable Factors table.
- **Spoken**:
  > "Drilling down into the vehicle, we don't just see a black-box score. FleetPulse provides full mathematical and physical explainability.
  > We see the coolant temperature climbing past 118 degrees Celsius, active misfire codes P0128 and P0300, and our ranked contributing factors showing exactly how much each signal influenced the probability.
  > The system provides a direct recommendation: 'Immediate vehicle grounding & dispatch maintenance unit'."

---

### Segment 5: Acknowledgment, Dispatch & Tamper-Proof Audit (2:25 – 2:45)
- **Visual**: Click "Dispatch Work Order" button. Select "Thermal System & Coolant Repair", Priority "Critical", and confirm. Switch to **Audit Log** tab.
- **Spoken**:
  > "The fleet manager acknowledges the alert and schedules an urgent work order with one click.
  > Switching to the Audit Trail tab, every single state change, user action, and dispatched work order is cryptographically recorded in our PostgreSQL audit log with timestamps, actor IDs, and immutable payload diffs."

---

### Segment 6: Architecture, Polyglot Storage & 100K Benchmark Evidence (2:45 – 3:50)
- **Visual**: Switch to terminal and architecture documentation (`docs/architecture/c4-architecture.md` and `docs/evidence/load-test/load_test_report.md`).
- **Spoken**:
  > "Behind FleetPulse is a production-grade polyglot architecture:
  > - **Kafka & Flink** handle event-time watermarking, sliding windows, and idempotent deduplication.
  > - **ClickHouse** stores high-velocity telemetry for sub-second analytical aggregations.
  > - **PostgreSQL 16** provides ACID consistency for tenants, fleets, and work orders.
  > - **Redis** serves in-memory hot vehicle states.
  > In our automated load benchmark, the platform successfully demonstrated 100,000+ events per second ingestion with a p95 latency under 100 microseconds."

---

### Segment 7: Chaos Resilience & Bounded AI Copilot (3:50 – 4:45)
- **Visual**: Open Fleet Copilot modal. Run query: *"Which vehicles are at highest risk right now?"* and show tool chip. Then show the automated chaos test report (`docs/evidence/chaos/chaos_report.md`).
- **Spoken**:
  > "We also feature Fleet Copilot—a bounded AI assistant equipped with a strict server-side tool allowlist. It answers queries over verified fleet data with zero arbitrary SQL access, and mandates explicit confirmation before executing write operations.
  > Furthermore, our automated chaos tests prove that under broker disconnects or network partitions, local ring buffers absorb telemetry with zero data loss upon reconnection."

---

### Segment 8: Conclusion & Measured Impact (4:45 – 5:00)
- **Visual**: Return to Command Centre overview with all systems green.
- **Spoken**:
  > "With an average warning lead time of 38.4 hours, FleetPulse prevents roadside breakdowns before they disrupt operations, saving fleets hundreds of thousands of dollars in downtime.
  > Thank you for reviewing FleetPulse."
