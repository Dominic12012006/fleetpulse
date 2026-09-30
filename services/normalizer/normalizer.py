"""
FleetPulse — Multi-OEM Telemetry Normalizer Service
Converts heterogeneous OEM payloads into CanonicalTelemetryEvents and isolates corrupt data to quarantine.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from packages.schemas.events import CanonicalTelemetryEvent
from packages.schemas.oem import normalize_oem_payload

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.normalizer")


class NormalizerService:
    def __init__(self):
        self.processed_count = 0
        self.quarantine_count = 0
        self.quarantine_records: List[Dict[str, Any]] = []

    def process_raw_payload(self, raw_data: Dict[str, Any]) -> Tuple[Optional[CanonicalTelemetryEvent], Optional[Dict[str, Any]]]:
        """
        Normalizes a single raw payload.
        Returns (canonical_event, None) on success, or (None, quarantine_record) on failure.
        """
        self.processed_count += 1
        oem = raw_data.get("oem") or raw_data.get("source_oem")

        if not oem:
            quarantine = self._create_quarantine_record(
                raw_data=raw_data,
                reason="Missing OEM discriminator tag in payload"
            )
            self.quarantine_count += 1
            self.quarantine_records.append(quarantine)
            return None, quarantine

        try:
            canonical = normalize_oem_payload(oem=oem, payload=raw_data)
            return canonical, None
        except Exception as exc:
            quarantine = self._create_quarantine_record(
                raw_data=raw_data,
                reason=f"Schema normalization failed for OEM '{oem}': {str(exc)}"
            )
            self.quarantine_count += 1
            self.quarantine_records.append(quarantine)
            logger.warning(f"Quarantined event: {quarantine['reason']}")
            return None, quarantine

    def process_batch(self, batch: List[Dict[str, Any]]) -> Tuple[List[CanonicalTelemetryEvent], List[Dict[str, Any]]]:
        """
        Normalizes a batch of raw telemetry events.
        """
        canonical_batch = []
        quarantine_batch = []

        for raw in batch:
            can, war = self.process_raw_payload(raw)
            if can:
                canonical_batch.append(can)
            if war:
                quarantine_batch.append(war)

        return canonical_batch, quarantine_batch

    def _create_quarantine_record(self, raw_data: Dict[str, Any], reason: str) -> Dict[str, Any]:
        return {
            "quarantined_at": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "raw_payload": raw_data,
            "tenant_id": raw_data.get("tenant_id") or raw_data.get("tenantId") or raw_data.get("tenant_code") or "unknown"
        }
