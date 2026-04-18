from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
import hashlib
import statistics
import logging

logger = logging.getLogger(__name__)

COLD_CHAIN_SPECS: Dict[str, Dict] = {
    "tomato":     {"max_temp_c": 12.0, "min_humidity": 80, "max_humidity": 95},
    "leafy":      {"max_temp_c": 5.0,  "min_humidity": 90, "max_humidity": 98},
    "potato":     {"max_temp_c": 8.0,  "min_humidity": 85, "max_humidity": 95},
    "onion":      {"max_temp_c": 25.0, "min_humidity": 60, "max_humidity": 70},
    "mango":      {"max_temp_c": 10.0, "min_humidity": 75, "max_humidity": 85},
    "default":    {"max_temp_c": 15.0, "min_humidity": 65, "max_humidity": 90},
}

@dataclass
class SensorReading:
    timestamp: float
    temp_c: float
    humidity_pct: float
    gps_lat: float = 0.0
    gps_lng: float = 0.0
    vibration_g: float = 0.0

@dataclass
class ColdChainReport:
    batch_id: str
    crop_type: str
    verdict: str
    integrity_score: float
    breach_events: List[Dict] = field(default_factory=list)
    max_temp_recorded: float = 0.0
    avg_temp: float = 0.0
    data_hash: str = ""
    requires_blockchain_audit: bool = False


def _generate_payload_hash(batch_id: str, readings: List[SensorReading]) -> str:
    raw = f"{batch_id}" + "".join(
        f"{r.timestamp:.0f}{r.temp_c:.2f}{r.humidity_pct:.1f}" for r in readings
    )
    return "0x" + hashlib.sha256(raw.encode()).hexdigest()


def validate_cold_chain_batch(
    batch_id: str,
    crop_type: str,
    readings: List[Dict],
) -> ColdChainReport:
    spec = COLD_CHAIN_SPECS.get(crop_type.lower(), COLD_CHAIN_SPECS["default"])
    parsed = [SensorReading(**r) for r in readings if all(k in r for k in ("timestamp", "temp_c", "humidity_pct"))]

    if not parsed:
        logger.warning(f"[EdgeValidator] No valid readings for batch {batch_id}")
        return ColdChainReport(batch_id=batch_id, crop_type=crop_type, verdict="UNKNOWN", integrity_score=0.0)

    temps = [r.temp_c for r in parsed]
    humidities = [r.humidity_pct for r in parsed]
    max_temp = max(temps)
    avg_temp = statistics.mean(temps)
    breach_events = []

    for r in parsed:
        if r.temp_c > spec["max_temp_c"]:
            breach_events.append({
                "type": "TEMP_BREACH",
                "ts": datetime.fromtimestamp(r.timestamp).isoformat(),
                "recorded": r.temp_c,
                "threshold": spec["max_temp_c"],
                "gps": (r.gps_lat, r.gps_lng),
            })
        if not (spec["min_humidity"] <= r.humidity_pct <= spec["max_humidity"]):
            breach_events.append({
                "type": "HUMIDITY_BREACH",
                "ts": datetime.fromtimestamp(r.timestamp).isoformat(),
                "recorded": r.humidity_pct,
                "expected_range": (spec["min_humidity"], spec["max_humidity"]),
            })

    breach_rate = len(breach_events) / len(parsed)
    integrity_score = round(max(0.0, (1 - breach_rate) * 100), 2)

    if breach_rate == 0:
        verdict = "APPROVED"
    elif breach_rate < 0.1:
        verdict = "WARNING"
    else:
        verdict = "REJECTED"

    payload_hash = _generate_payload_hash(batch_id, parsed)
    requires_audit = verdict in ("WARNING", "REJECTED")

    logger.info(f"[EdgeValidator] Batch {batch_id} → {verdict} (score={integrity_score})")

    return ColdChainReport(
        batch_id=batch_id,
        crop_type=crop_type,
        verdict=verdict,
        integrity_score=integrity_score,
        breach_events=breach_events,
        max_temp_recorded=max_temp,
        avg_temp=round(avg_temp, 2),
        data_hash=payload_hash,
        requires_blockchain_audit=requires_audit,
    )
