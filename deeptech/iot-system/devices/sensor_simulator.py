"""
D2Farm IoT System — Sensor Simulator

Simulates a fleet of IoT sensors attached to cold storage rooms and
refrigerated transport vehicles. Each device emits readings at a
configurable interval using a Brownian motion random walk — realistic
enough to test alerting and dashboard logic without physical hardware.

Integration note: this module is designed to integrate via API in future.
In production this script is replaced by real MQTT-connected hardware
publishing to: d2farm/sensors/<device_id>

Run: python devices/sensor_simulator.py
"""

import asyncio
import random
import time
import json
import logging
import sys
import os
from datetime import datetime, timezone
from dataclasses import dataclass, asdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import DEVICE_REGISTRY, SENSOR_EMIT_INTERVAL_SEC, DeviceProfile

logger = logging.getLogger("iot.simulator")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


# ── Reading dataclass ─────────────────────────────────────────────────────────

@dataclass
class SensorReading:
    device_id:    str
    device_name:  str
    device_type:  str
    crop:         str
    location:     str
    timestamp:    str           # ISO 8601
    temperature:  float         # °C
    humidity:     float         # %
    battery_pct:  float         # 0–100
    signal_rssi:  int           # dBm
    shock_g:      float         # g-force (0 = stationary)
    is_fault:     bool          # simulated hardware fault

    def to_json(self) -> str:
        return json.dumps(asdict(self))


# ── Brownian-walk state per device ────────────────────────────────────────────

class DeviceState:
    def __init__(self, profile: DeviceProfile):
        self.profile  = profile
        self.temp     = profile.temp_mean + random.gauss(0, profile.temp_std)
        self.humid    = profile.humid_mean + random.gauss(0, profile.humid_std)
        self.battery  = random.uniform(75.0, 100.0)
        self.rssi     = random.randint(-80, -45)

    def step(self) -> SensorReading:
        """Advance state by one timestep and emit a reading."""
        p = self.profile

        # Drift temperature and humidity with mean-reversion (Ornstein–Uhlenbeck)
        alpha = 0.15
        self.temp  += alpha * (p.temp_mean  - self.temp)  + random.gauss(0, p.temp_std)
        self.humid += alpha * (p.humid_mean - self.humid) + random.gauss(0, p.humid_std)

        # Clamp to physically plausible range
        self.temp  = round(max(-5.0, min(40.0, self.temp)), 2)
        self.humid = round(max(20.0, min(100.0, self.humid)), 2)

        # Battery slowly drains
        self.battery = round(max(0.0, self.battery - random.uniform(0.0, 0.05)), 1)

        # Signal noise
        self.rssi = max(-100, min(-30, self.rssi + random.randint(-3, 3)))

        # Shock event for transport vehicles
        is_vehicle = p.device_type == "transport_vehicle"
        shock = round(random.expovariate(5.0), 3) if is_vehicle else 0.0

        # Fault injection (sporadic high temp to test alerting)
        is_fault = random.random() < p.fault_prob
        if is_fault:
            self.temp = round(self.temp + random.uniform(8.0, 15.0), 2)
            logger.warning("⚠️  FAULT INJECTED on %s — temp spiked to %.1f°C", p.device_id, self.temp)

        return SensorReading(
            device_id   = p.device_id,
            device_name = p.name,
            device_type = p.device_type,
            crop        = p.crop,
            location    = p.location,
            timestamp   = datetime.now(timezone.utc).isoformat(),
            temperature = self.temp,
            humidity    = self.humid,
            battery_pct = self.battery,
            signal_rssi = self.rssi,
            shock_g     = shock,
            is_fault    = is_fault,
        )


# ── Async emission loop ───────────────────────────────────────────────────────

# Shared in-memory queue — consumed by data_ingestion.py
reading_queue: asyncio.Queue = asyncio.Queue(maxsize=1000)


async def simulate_device(state: DeviceState):
    """Continuously emit readings for one device."""
    while True:
        reading = state.step()
        try:
            reading_queue.put_nowait(reading)
        except asyncio.QueueFull:
            logger.warning("Reading queue full — dropping reading from %s", state.profile.device_id)

        logger.debug(
            "[%s] T=%.1f°C H=%.1f%% bat=%.0f%% rssi=%ddBm",
            state.profile.device_id, reading.temperature, reading.humidity,
            reading.battery_pct, reading.signal_rssi
        )
        await asyncio.sleep(SENSOR_EMIT_INTERVAL_SEC)


async def run_all_simulators():
    """Boot all registered devices and run their loops concurrently."""
    states = [DeviceState(profile) for profile in DEVICE_REGISTRY]
    logger.info("🌡️  Starting %d IoT sensor simulators (interval=%.0fs)", len(states), SENSOR_EMIT_INTERVAL_SEC)
    await asyncio.gather(*[simulate_device(s) for s in states])


async def _drain_queue_to_console():
    """Dev helper: print readings to stdout when running standalone."""
    while True:
        reading = await reading_queue.get()
        print(reading.to_json())


if __name__ == "__main__":
    async def main():
        await asyncio.gather(run_all_simulators(), _drain_queue_to_console())
    asyncio.run(main())
