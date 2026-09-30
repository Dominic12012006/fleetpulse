"""
Unit Tests for FleetPulse Simulator and Physics Engine
"""

from apps.simulator.generator import FleetGenerator, generate_synthetic_vin
from apps.simulator.physics import VehiclePhysicsState
from apps.simulator.scenarios import ScenarioEngine, ScenarioName
from packages.schemas.events import PropulsionType


def test_synthetic_vin_generation():
    vin1 = generate_synthetic_vin("seed-1")
    vin2 = generate_synthetic_vin("seed-1")
    assert vin1 == vin2, "VIN generation must be deterministic for identical seeds"
    assert len(vin1) == 17
    for forbidden in ("I", "O", "Q"):
        assert forbidden not in vin1


def test_fleet_generator_deterministic_count():
    gen1 = FleetGenerator(seed=42)
    fleet1 = gen1.generate_fleet(count=50)

    gen2 = FleetGenerator(seed=42)
    fleet2 = gen2.generate_fleet(count=50)

    assert len(fleet1) == 50
    assert fleet1[0]["vin"] == fleet2[0]["vin"]
    assert fleet1[0]["id"] == fleet2[0]["id"]
    assert fleet1[10]["model"] == fleet2[10]["model"]


def test_ice_physics_step():
    state = VehiclePhysicsState(
        vehicle_id="v-1",
        vin="1HGCR2F83HA123456",
        propulsion_type=PropulsionType.ICE,
        lat=41.8781,
        lon=-87.6298,
        odometer_km=5000.0
    )
    initial_odo = state.odometer_km
    _event_type, is_anomaly = state.step(dt_seconds=5.0)

    assert state.odometer_km >= initial_odo
    assert state.engine_temp_c is not None
    assert 80.0 <= state.engine_temp_c <= 105.0
    assert is_anomaly is False


def test_thermal_overheat_scenario():
    gen = FleetGenerator(seed=42)
    vehicles = gen.generate_fleet(count=1)
    states = gen.create_physics_states(vehicles)
    engine = ScenarioEngine(seed=42)

    v_meta = vehicles[0]
    p_state = states[v_meta["id"]]
    p_state.propulsion_type = PropulsionType.ICE
    p_state.engine_temp_c = 92.0

    engine.apply_scenario_to_state(ScenarioName.THERMAL_OVERHEAT, p_state)

    for _ in range(30):
        engine.generate_event(v_meta, p_state, scenario=ScenarioName.THERMAL_OVERHEAT, dt_seconds=1.0)

    assert p_state.engine_temp_c > 110.0
    assert "P0128" in p_state.active_dtcs or "P0300" in p_state.active_dtcs


def test_ev_battery_degradation_scenario():
    gen = FleetGenerator(seed=42)
    vehicles = gen.generate_fleet(count=1)
    states = gen.create_physics_states(vehicles)
    engine = ScenarioEngine(seed=42)

    v_meta = vehicles[0]
    p_state = states[v_meta["id"]]
    p_state.propulsion_type = PropulsionType.EV
    p_state.soc_pct = 75.0
    p_state.battery_temp_c = 30.0

    engine.apply_scenario_to_state(ScenarioName.EV_BATTERY_DEGRADATION, p_state)

    for _ in range(25):
        engine.generate_event(v_meta, p_state, scenario=ScenarioName.EV_BATTERY_DEGRADATION, dt_seconds=1.0)

    assert p_state.battery_temp_c > 45.0
    assert p_state.soc_pct < 75.0
    assert "P0A80" in p_state.active_dtcs


def test_duplicate_storm_scenario():
    gen = FleetGenerator(seed=42)
    vehicles = gen.generate_fleet(count=10)
    states = gen.create_physics_states(vehicles)
    engine = ScenarioEngine(seed=42)

    total_events = 0
    duplicate_count = 0
    seen_ids = set()

    for _ in range(100):
        for v in vehicles:
            events = engine.generate_event(v, states[v["id"]], scenario=ScenarioName.DUPLICATE_STORM)
            for e in events:
                if "event_id" in e:
                    if e["event_id"] in seen_ids:
                        duplicate_count += 1
                    seen_ids.add(e["event_id"])
                    total_events += 1

    assert duplicate_count > 0, "Duplicate storm should produce duplicate event_ids"
