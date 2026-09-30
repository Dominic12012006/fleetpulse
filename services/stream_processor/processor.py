"""
FleetPulse — Event-Time Stream Processor (Flink Semantics)
Implements event-time watermarking, late event handling, sliding windows, and idempotent deduplication.
"""

from collections import deque
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Deque, Dict, List, Optional, Set, Tuple

from packages.schemas.events import CanonicalTelemetryEvent, EventType

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.stream_processor")


class RollingVehicleWindow:
    """Sliding time-window state for a single vehicle."""
    def __init__(self, vehicle_id: str, window_duration: timedelta = timedelta(minutes=15)):
        self.vehicle_id = vehicle_id
        self.window_duration = window_duration
        self.events: Deque[CanonicalTelemetryEvent] = deque()

    def add_event(self, event: CanonicalTelemetryEvent) -> None:
        self.events.append(event)
        self.evict_old(event.event_time)

    def evict_old(self, current_time: datetime) -> None:
        cutoff = current_time - self.window_duration
        while self.events and self.events[0].event_time < cutoff:
            self.events.popleft()

    def compute_features(self) -> Dict[str, Any]:
        """Calculates sliding window aggregate features."""
        if not self.events:
            return {}

        latest = self.events[-1]
        active_dtcs: Set[str] = set()
        harsh_events_5m = 0
        temp_readings: List[Tuple[datetime, float]] = []
        soc_readings: List[Tuple[datetime, float]] = []

        now = latest.event_time
        five_min_cutoff = now - timedelta(minutes=5)

        for e in self.events:
            if e.dtc_codes:
                active_dtcs.update(e.dtc_codes)
            if e.event_time >= five_min_cutoff and e.event_type in (EventType.HARSH_BRAKE, EventType.HARSH_ACCEL):
                harsh_events_5m += 1
            if e.engine_temp_c is not None:
                temp_readings.append((e.event_time, e.engine_temp_c))
            elif e.battery_temp_c is not None:
                temp_readings.append((e.event_time, e.battery_temp_c))
            if e.soc_pct is not None:
                soc_readings.append((e.event_time, e.soc_pct))

        # Temperature slope (deg C per minute over last 3 minutes)
        temp_slope_c_per_min = 0.0
        if len(temp_readings) >= 2:
            t_first, temp_first = temp_readings[0]
            t_last, temp_last = temp_readings[-1]
            dt_min = (t_last - t_first).total_seconds() / 60.0
            if dt_min > 0.05:
                temp_slope_c_per_min = (temp_last - temp_first) / dt_min

        # SoC discharge velocity (% per minute)
        soc_discharge_per_min = 0.0
        if len(soc_readings) >= 2:
            s_first_t, s_first_val = soc_readings[0]
            s_last_t, s_last_val = soc_readings[-1]
            dt_min = (s_last_t - s_first_t).total_seconds() / 60.0
            if dt_min > 0.05:
                soc_discharge_per_min = max(0.0, (s_first_val - s_last_val) / dt_min)

        return {
            "vehicle_id": self.vehicle_id,
            "vin": latest.vin,
            "tenant_id": latest.tenant_id,
            "event_time": latest.event_time,
            "current_temp": latest.engine_temp_c or latest.battery_temp_c or 0.0,
            "temp_slope_c_per_min": round(temp_slope_c_per_min, 2),
            "harsh_events_5m": harsh_events_5m,
            "soc_discharge_per_min": round(soc_discharge_per_min, 2),
            "current_soc": latest.soc_pct,
            "odometer_km": latest.odometer_km,
            "active_dtcs": sorted(list(active_dtcs)),
            "speed_kmh": latest.speed_kmh,
            "lat": latest.lat,
            "lon": latest.lon
        }


class StreamProcessorService:
    def __init__(self, allowed_lateness_seconds: float = 5.0, dedup_capacity: int = 500000):
        self.allowed_lateness = timedelta(seconds=allowed_lateness_seconds)
        self.watermark: Optional[datetime] = None
        self.windows: Dict[str, RollingVehicleWindow] = {}
        
        # Deduplication cache (LRU set approximation with bounded capacity)
        self.seen_event_ids: Set[str] = set()
        self.event_id_queue: Deque[str] = deque()
        self.dedup_capacity = dedup_capacity

        # Metrics
        self.processed_count = 0
        self.duplicate_count = 0
        self.late_event_count = 0

    def is_duplicate(self, event_id: str) -> bool:
        if event_id in self.seen_event_ids:
            return True
        self.seen_event_ids.add(event_id)
        self.event_id_queue.append(event_id)
        if len(self.event_id_queue) > self.dedup_capacity:
            oldest = self.event_id_queue.popleft()
            self.seen_event_ids.discard(oldest)
        return False

    def update_watermark(self, event_time: datetime) -> None:
        new_watermark = event_time - self.allowed_lateness
        if self.watermark is None or new_watermark > self.watermark:
            self.watermark = new_watermark

    def process_event(self, event: CanonicalTelemetryEvent) -> Optional[Dict[str, Any]]:
        """
        Processes a single event through watermark, deduplication, and windowing.
        Returns feature dictionary or None if duplicate.
        """
        # Step 1: Idempotency check
        if self.is_duplicate(event.event_id):
            self.duplicate_count += 1
            return None

        # Step 2: Event-time watermarking & late check
        if self.watermark is not None and event.event_time < self.watermark:
            self.late_event_count += 1
            # Late events are still processed for state, but flagged
            is_late = True
        else:
            is_late = False
            self.update_watermark(event.event_time)

        # Step 3: Rolling window aggregation
        v_id = event.vehicle_id
        if v_id not in self.windows:
            self.windows[v_id] = RollingVehicleWindow(vehicle_id=v_id)

        window = self.windows[v_id]
        window.add_event(event)
        self.processed_count += 1

        features = window.compute_features()
        features["is_late"] = is_late
        features["event_id"] = event.event_id
        features["processing_time"] = datetime.now(timezone.utc)
        return features
