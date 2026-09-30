"""
FleetPulse Cold Storage Archiver — Export Historical Telemetry to Apache Parquet
Partitions telemetry events by tenant_id, year, month, and day for cloud lake storage.
"""

import logging
import os
from datetime import datetime, timezone

import pandas as pd

from apps.simulator.generator import FleetGenerator
from apps.simulator.scenarios import ScenarioEngine, ScenarioName

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.cold_storage")

EXPORT_DIR = "data/samples/parquet"


def export_telemetry_batch_to_parquet(sample_events: int = 20000, seed: int = 42) -> str:
    logger.info(f"Generating {sample_events:,} synthetic telemetry events for cold Parquet archive...")
    gen = FleetGenerator(seed=seed)
    vehicles = gen.generate_fleet(count=1000)
    states = gen.create_physics_states(vehicles)
    scenario_engine = ScenarioEngine(seed=seed)

    records = []
    now = datetime.now(timezone.utc)

    for i in range(sample_events):
        v = vehicles[i % len(vehicles)]
        events = scenario_engine.generate_event(v, states[v["id"]], scenario=ScenarioName.NORMAL, now=now)
        for e in events:
            records.append({
                "event_id": e.get("event_id"),
                "vehicle_id": e.get("vehicle_id"),
                "vin": e.get("vin"),
                "tenant_id": e.get("tenant_id"),
                "event_time": e.get("event_time"),
                "lat": e.get("lat"),
                "lon": e.get("lon"),
                "speed_kmh": e.get("speed_kmh"),
                "odometer_km": e.get("odometer_km"),
                "engine_temp_c": e.get("engine_temp_c"),
                "soc_pct": e.get("soc_pct"),
                "event_type": e.get("event_type"),
                "is_anomaly": e.get("is_anomaly")
            })

    df = pd.DataFrame(records)
    df["event_time"] = pd.to_datetime(df["event_time"])
    df["year"] = df["event_time"].dt.year
    df["month"] = df["event_time"].dt.month
    df["day"] = df["event_time"].dt.day

    os.makedirs(EXPORT_DIR, exist_ok=True)
    out_file = os.path.join(EXPORT_DIR, f"telemetry_{now.strftime('%Y%m%d_%H%M%S')}.parquet")
    df.to_parquet(out_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Successfully exported {len(df):,} compressed rows to {out_file} (Size: {os.path.getsize(out_file)/1024:.1f} KB)")
    return out_file


if __name__ == "__main__":
    export_telemetry_batch_to_parquet(sample_events=10000)
