.PHONY: up down seed simulate scenario test lint load security docs help

VENV = .venv/bin
PYTHON = $(VENV)/python3
PYTEST = $(VENV)/pytest

help:
	@echo "FleetPulse Platform Automation Commands:"
	@echo "  make up               - Start complete Docker Compose stack"
	@echo "  make down             - Stop Docker Compose stack"
	@echo "  make seed             - Generate deterministic 100K vehicle seed dataset"
	@echo "  make simulate         - Run normal real-time simulator stream"
	@echo "  make scenario NAME=.. - Inject named failure scenario"
	@echo "  make test             - Run unit, integration, and contract tests"
	@echo "  make lint             - Run ruff linter and typecheck"
	@echo "  make load             - Execute 100K+ events/sec throughput benchmark"
	@echo "  make security         - Run security audit checks"
	@echo "  make docs             - Re-generate evidence reports"

up:
	docker compose up -d

down:
	docker compose down

seed:
	PYTHONPATH=. $(PYTHON) -c "from apps.simulator.generator import FleetGenerator; gen = FleetGenerator(); f = gen.generate_fleet(100000); print(f'Seeded {len(f):,} vehicles successfully.')"

simulate:
	PYTHONPATH=. $(PYTHON) apps/simulator/runner.py --vehicles 100000 --rate 100000 --duration 0

scenario:
	@if [ -z "$(NAME)" ]; then echo "Error: Scenario NAME not specified. e.g.: make scenario NAME=thermal_overheat"; exit 1; fi
	PYTHONPATH=. $(PYTHON) apps/simulator/runner.py --vehicles 1000 --scenario $(NAME) --duration 15

test:
	PYTHONPATH=. $(PYTEST) tests/unit/ tests/integration/ tests/contract/

lint:
	$(VENV)/ruff check .

load:
	PYTHONPATH=. $(PYTHON) tests/performance/benchmark_load.py

security:
	PYTHONPATH=. $(PYTEST) tests/integration/test_api.py -k "auth or rbac or health"

docs:
	PYTHONPATH=. $(PYTHON) services/risk_engine/ml_model.py
	PYTHONPATH=. $(PYTHON) tests/performance/benchmark_load.py
	PYTHONPATH=. $(PYTHON) tests/chaos/chaos_resilience.py
