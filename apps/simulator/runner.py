"""
FleetPulse Simulator — High-Throughput Asynchronous Simulation Runner & Benchmark
Capable of generating and dispatching 100K+ events/sec with deterministic physics.
"""

import argparse
import asyncio
import logging
import time

from apps.simulator.generator import FleetGenerator
from apps.simulator.scenarios import ScenarioEngine, ScenarioName

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.simulator")


class SimulatorRunner:
    def __init__(
        self,
        vehicle_count: int = 100000,
        seed: int = 42,
        scenario: str = "normal",
        target_rate: int = 100000
    ):
        self.vehicle_count = vehicle_count
        self.seed = seed
        self.scenario = ScenarioName(scenario.lower())
        self.target_rate = target_rate
        self.generator = FleetGenerator(seed=seed)
        self.scenario_engine = ScenarioEngine(seed=seed)

        logger.info(f"Generating metadata for {vehicle_count:,} synthetic vehicles (seed={seed})...")
        t0 = time.perf_counter()
        self.vehicles = self.generator.generate_fleet(count=vehicle_count)
        self.physics_states = self.generator.create_physics_states(self.vehicles)
        logger.info(f"Generated {len(self.vehicles):,} vehicles in {time.perf_counter() - t0:.2f}s")

        # If a failure scenario is active, inject it into a subset of vehicles (e.g., top 100)
        if self.scenario != ScenarioName.NORMAL:
            target_count = min(100, len(self.vehicles))
            for i in range(target_count):
                v_id = self.vehicles[i]["id"]
                self.scenario_engine.apply_scenario_to_state(self.scenario, self.physics_states[v_id])
            logger.info(f"Activated scenario '{self.scenario.value}' on {target_count} vehicles.")

    def run_benchmark(self, iterations: int = 200000) -> float:
        """
        Runs an in-memory generation benchmark to measure raw throughput without network I/O.
        """
        logger.info(f"Starting in-memory throughput benchmark for {iterations:,} events...")
        t_start = time.perf_counter()
        count = 0
        v_len = len(self.vehicles)

        for i in range(iterations):
            idx = i % v_len
            v_meta = self.vehicles[idx]
            p_state = self.physics_states[v_meta["id"]]
            events = self.scenario_engine.generate_event(v_meta, p_state, scenario=self.scenario)
            count += len(events)

        elapsed = time.perf_counter() - t_start
        throughput = count / elapsed if elapsed > 0 else 0
        logger.info(f"Benchmark finished: generated {count:,} events in {elapsed:.3f}s -> {throughput:,.0f} events/sec")
        return throughput

    async def stream_live(self, duration_sec: int = 10, batch_size: int = 1000, callback=None):
        """
        Simulates live real-time vehicle telemetry stream.
        """
        logger.info(f"Starting live streaming simulation (scenario={self.scenario.value})...")
        start_time = time.perf_counter()
        total_events = 0
        idx = 0
        v_len = len(self.vehicles)

        while True:
            batch = []
            for _ in range(batch_size):
                v_meta = self.vehicles[idx % v_len]
                p_state = self.physics_states[v_meta["id"]]
                events = self.scenario_engine.generate_event(v_meta, p_state, scenario=self.scenario)
                batch.extend(events)
                idx += 1

            total_events += len(batch)
            if callback:
                await callback(batch)

            elapsed = time.perf_counter() - start_time
            if duration_sec > 0 and elapsed >= duration_sec:
                break

            # Bounded sleep to yield event loop
            await asyncio.sleep(0.001)

        rate = total_events / elapsed if elapsed > 0 else 0
        logger.info(f"Live simulation completed: {total_events:,} events in {elapsed:.2f}s ({rate:,.0f} eps)")


def main():
    parser = argparse.ArgumentParser(description="FleetPulse 100K+ Vehicle Simulator")
    parser.add_argument("--vehicles", type=int, default=100000, help="Number of vehicles (default: 100,000)")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed")
    parser.add_argument("--scenario", type=str, default="normal",
                        choices=["normal", "thermal_overheat", "brake_failure", "ev_battery_degradation",
                                 "duplicate_storm", "out_of_order", "burst_3x", "unknown_oem_schema"])
    parser.add_argument("--benchmark", action="store_true", help="Run in-memory throughput benchmark")
    parser.add_argument("--benchmark-events", type=int, default=200000, help="Events count for benchmark")
    parser.add_argument("--duration", type=int, default=10, help="Live stream duration in seconds (0 for infinite)")
    parser.add_argument("--rate", type=int, default=100000, help="Target events per second")

    args = parser.parse_args()

    runner = SimulatorRunner(
        vehicle_count=args.vehicles,
        seed=args.seed,
        scenario=args.scenario,
        target_rate=args.rate
    )

    if args.benchmark:
        throughput = runner.run_benchmark(iterations=args.benchmark_events)
        print(f"BENCHMARK_RESULT: {throughput:,.0f} events/sec")
    else:
        asyncio.run(runner.stream_live(duration_sec=args.duration))


if __name__ == "__main__":
    main()
