"""
D2Farm IoT System — Data Ingestion Service

Consumes sensor readings from the device queue, validates them,
evaluates alert thresholds, and exposes a REST API for the dashboard.

Integration note: this module is designed to integrate via API in future.
Endpoints:
    GET  /iot/get-sensor-data          → latest reading per device
    GET  /iot/get-sensor-data/{id}     → reading history for one device
    GET  /iot/alerts                   → active unacknowledged alerts
    POST /iot/acknowledge-alert/{id}   → mark alert resolved

Run: python services/data_ingestion.py
"""

import asyncio
import sys
import os
import logging
from collections import deque, defaultdict
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass, asdict
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, HTTPException
import uvicorn

from config import (
    IOT_API_HOST, IOT_API_PORT, BUFFER_MAX_READINGS,
    CROP_SAFE_BANDS, ALERT_WARN_MARGIN, ALERT_CRIT_MARGIN, DEVICE_REGISTRY
)
from devices.sensor_simulator import SensorReading, reading_queue, run_all_simulators

logger = logging.getLogger("iot.ingestion")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


# ── In-memory store ───────────────────────────────────────────────────────────

# Latest reading per device
latest_readings: dict[str, SensorReading] = {}

# Rolling history per device (capped at BUFFER_MAX_READINGS)
reading_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=BUFFER_MAX_READINGS))


# ── Alert dataclass ───────────────────────────────────────────────────────────

@dataclass
class Alert:
    alert_id:     str
    device_id:    str
    device_name:  str
    crop:         str
    location:     str
    severity:     str          # "WARNING" | "CRITICAL"
    parameter:    str          # "temperature" | "humidity" | "battery" | "shock"
    actual_value: float
    safe_min:     float
    safe_max:     float
    message:      str
    timestamp:    str
    acknowledged: bool = False

active_alerts: dict[str, Alert] = {}   # alert_id → Alert


# ── Alert evaluation ──────────────────────────────────────────────────────────

def evaluate_thresholds(reading: SensorReading) -> list[Alert]:
    """Check if a reading violates safe bands. Returns list of new alerts."""
    alerts: list[Alert] = []
    bands = CROP_SAFE_BANDS.get(reading.crop, CROP_SAFE_BANDS["DEFAULT"])
    t_min, t_max, h_min, h_max = bands

    def make_alert(param: str, actual: float, safe_min: float, safe_max: float,
                   margin: float, label: str) -> Optional[Alert]:
        overshoot = max(0.0, actual - safe_max, safe_min - actual)
        if overshoot == 0:
            return None
        severity = "CRITICAL" if overshoot >= margin * 2 else "WARNING"
        msg = (
            f"{label} {actual:.1f} {'above max' if actual > safe_max else 'below min'} "
            f"safe range [{safe_min}–{safe_max}] for {reading.crop} "
            f"on {reading.device_name} ({reading.location})"
        )
        return Alert(
            alert_id    = str(uuid.uuid4()),
            device_id   = reading.device_id,
            device_name = reading.device_name,
            crop        = reading.crop,
            location    = reading.location,
            severity    = severity,
            parameter   = param,
            actual_value= round(actual, 2),
            safe_min    = safe_min,
            safe_max    = safe_max,
            message     = msg,
            timestamp   = reading.timestamp,
        )

    for a in [
        make_alert("temperature", reading.temperature, t_min, t_max, ALERT_WARN_MARGIN, "Temperature"),
        make_alert("humidity",    reading.humidity,    h_min, h_max, ALERT_WARN_MARGIN, "Humidity"),
    ]:
        if a:
            alerts.append(a)
            logger.warning("🚨 [%s] %s | %s", a.severity, a.device_id, a.message)

    # Battery low
    if reading.battery_pct < 15.0:
        alerts.append(Alert(
            alert_id    = str(uuid.uuid4()),
            device_id   = reading.device_id,
            device_name = reading.device_name,
            crop        = reading.crop,
            location    = reading.location,
            severity    = "WARNING",
            parameter   = "battery",
            actual_value= reading.battery_pct,
            safe_min    = 15.0,
            safe_max    = 100.0,
            message     = f"Battery low ({reading.battery_pct:.0f}%) on {reading.device_name}",
            timestamp   = reading.timestamp,
        ))

    # Shock event
    if reading.shock_g > 3.0:
        alerts.append(Alert(
            alert_id    = str(uuid.uuid4()),
            device_id   = reading.device_id,
            device_name = reading.device_name,
            crop        = reading.crop,
            location    = reading.location,
            severity    = "WARNING",
            parameter   = "shock",
            actual_value= reading.shock_g,
            safe_min    = 0.0,
            safe_max    = 3.0,
            message     = f"High shock event ({reading.shock_g:.1f}g) on {reading.device_name}",
            timestamp   = reading.timestamp,
        ))

    return alerts


# ── Background consumer ───────────────────────────────────────────────────────

async def consume_readings():
    """Drain the simulator queue, update stores, and evaluate alerts."""
    logger.info("📡 Ingestion service started — consuming sensor queue")
    while True:
        reading: SensorReading = await reading_queue.get()
        latest_readings[reading.device_id] = reading
        reading_history[reading.device_id].appendleft(reading)

        new_alerts = evaluate_thresholds(reading)
        for alert in new_alerts:
            active_alerts[alert.alert_id] = alert


# ── FastAPI REST layer ────────────────────────────────────────────────────────

app = FastAPI(
    title="D2Farm IoT Ingestion API",
    version="1.0.0",
    description="Real-time sensor data access for the D2Farm supply chain.",
)


@app.get("/health")
def health():
    return {"status": "ok", "devices": len(DEVICE_REGISTRY), "active_alerts": len(active_alerts)}


@app.get("/iot/get-sensor-data")
def get_all_latest():
    """Latest reading for every registered device. Integration: GET /iot/get-sensor-data"""
    return {
        "success": True,
        "count":   len(latest_readings),
        "data":    [asdict(r) for r in latest_readings.values()],
    }


@app.get("/iot/get-sensor-data/{device_id}")
def get_device_history(device_id: str, limit: int = 50):
    """Rolling history for one device. Integration: GET /iot/get-sensor-data/:id"""
    history = reading_history.get(device_id)
    if history is None:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found.")
    return {
        "success":   True,
        "device_id": device_id,
        "count":     len(history),
        "data":      [asdict(r) for r in list(history)[:limit]],
    }


@app.get("/iot/alerts")
def get_active_alerts():
    """All unacknowledged alerts. Integration: GET /iot/alerts"""
    open_alerts = [asdict(a) for a in active_alerts.values() if not a.acknowledged]
    return {"success": True, "count": len(open_alerts), "alerts": open_alerts}


@app.post("/iot/acknowledge-alert/{alert_id}")
def acknowledge_alert(alert_id: str):
    """Mark an alert as resolved. Integration: POST /iot/acknowledge-alert/:id"""
    if alert_id not in active_alerts:
        raise HTTPException(status_code=404, detail="Alert not found.")
    active_alerts[alert_id].acknowledged = True
    return {"success": True, "alert_id": alert_id, "message": "Alert acknowledged."}


# ── Entry point ───────────────────────────────────────────────────────────────

async def start():
    # Run simulator + consumer concurrently in the same event loop
    await asyncio.gather(
        run_all_simulators(),
        consume_readings(),
        asyncio.to_thread(
            uvicorn.run, app,
            host=IOT_API_HOST, port=IOT_API_PORT,
            log_level="warning"
        )
    )


if __name__ == "__main__":
    asyncio.run(start())
