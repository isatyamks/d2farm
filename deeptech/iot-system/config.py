"""
D2Farm IoT System — Configuration

All device registry, alert thresholds, and connection settings live here.
Override with environment variables in production.

Integration note: this module is designed to integrate via API in future.
Endpoints: GET /iot/get-sensor-data, WS /iot/stream
"""

import os
from dataclasses import dataclass, field
from typing import ClassVar

# ── API Server ────────────────────────────────────────────────────────────────
IOT_API_HOST = os.getenv("IOT_API_HOST", "0.0.0.0")
IOT_API_PORT = int(os.getenv("IOT_API_PORT", "5200"))
WS_PORT      = int(os.getenv("IOT_WS_PORT",  "5201"))

# ── Simulator ─────────────────────────────────────────────────────────────────
SENSOR_EMIT_INTERVAL_SEC = float(os.getenv("SENSOR_INTERVAL", "5"))   # emit every N seconds
BUFFER_MAX_READINGS      = 200     # max readings kept in memory per device

# ── MQTT (stubbed — will connect to AWS IoT Core in v2) ───────────────────────
MQTT_BROKER   = os.getenv("MQTT_BROKER",   "localhost")
MQTT_PORT     = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC    = os.getenv("MQTT_TOPIC",    "d2farm/sensors/#")
MQTT_ENABLED  = os.getenv("MQTT_ENABLED",  "false").lower() == "true"

# ── Crop-specific safe storage bands ─────────────────────────────────────────
# Format: crop → (temp_min_C, temp_max_C, humidity_min_pct, humidity_max_pct)
CROP_SAFE_BANDS: dict[str, tuple[float, float, float, float]] = {
    "Tomato":   (12.0, 18.0, 85.0, 95.0),
    "Mango":    (10.0, 13.0, 85.0, 95.0),
    "Banana":   (13.0, 15.0, 90.0, 98.0),
    "Potato":   (4.0,  8.0,  90.0, 95.0),
    "Onion":    (1.0,  4.0,  65.0, 70.0),
    "Wheat":    (10.0, 25.0, 40.0, 60.0),
    "Rice":     (10.0, 20.0, 60.0, 70.0),
    "Garlic":   (0.0,  5.0,  60.0, 70.0),
    "Ginger":   (12.0, 14.0, 90.0, 95.0),
    "Capsicum": (7.0,  10.0, 90.0, 95.0),
    "DEFAULT":  (5.0,  25.0, 60.0, 90.0),
}

# ── Alert severity thresholds (° or % beyond safe band edge) ─────────────────
ALERT_WARN_MARGIN  = 2.0    # within 2° → WARNING
ALERT_CRIT_MARGIN  = 5.0    # beyond 5° → CRITICAL

# ── Simulated device registry ─────────────────────────────────────────────────
@dataclass
class DeviceProfile:
    device_id:   str
    name:        str
    device_type: str          # "cold_storage" | "transport_vehicle" | "loading_bay"
    crop:        str
    location:    str
    # Simulation drift parameters (realistic brownian walk)
    temp_mean:   float = 15.0
    temp_std:    float = 0.4
    humid_mean:  float = 88.0
    humid_std:   float = 0.6
    # Occasional fault injection probability (0–1)
    fault_prob:  float = 0.02

DEVICE_REGISTRY: list[DeviceProfile] = [
    DeviceProfile("DEV-001", "Cold Room A — Tomato",   "cold_storage",     "Tomato",   "Nashik Warehouse",      temp_mean=14.0,  humid_mean=90.0),
    DeviceProfile("DEV-002", "Cold Room B — Mango",    "cold_storage",     "Mango",    "Pune Warehouse",        temp_mean=11.5,  humid_mean=92.0),
    DeviceProfile("DEV-003", "Reefer Truck TN-4829",   "transport_vehicle","Tomato",   "Mumbai Highway",        temp_mean=15.0,  humid_mean=88.0, temp_std=0.9, fault_prob=0.05),
    DeviceProfile("DEV-004", "Reefer Truck MH-7721",   "transport_vehicle","Onion",    "Nashik–Delhi Route",    temp_mean=3.0,   humid_mean=67.0, temp_std=0.7),
    DeviceProfile("DEV-005", "Loading Bay — Wheat",    "loading_bay",      "Wheat",    "Punjab Distribution",   temp_mean=22.0,  humid_mean=55.0, temp_std=1.2),
    DeviceProfile("DEV-006", "Cold Room C — Potato",   "cold_storage",     "Potato",   "Agra Cold Storage",     temp_mean=6.0,   humid_mean=92.0),
    DeviceProfile("DEV-007", "Reefer Van GJ-3341",     "transport_vehicle","Banana",   "Gujarat–Mumbai",        temp_mean=14.0,  humid_mean=94.0, temp_std=0.8, fault_prob=0.04),
]
