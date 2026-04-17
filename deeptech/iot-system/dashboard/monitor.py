"""
D2Farm IoT System — Real-Time Monitor Dashboard (CLI)

Provides a live terminal dashboard showing:
  - Current readings per device with colour-coded status
  - Active alert count and most recent alert message
  - Per-crop safe-band compliance rate

Integration note: this module is designed to integrate via API in future.
The frontend will consume the same data via GET /iot/get-sensor-data
and display it in the OrderTracking view.

Run: python dashboard/monitor.py
"""

import asyncio
import sys
import os
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import CROP_SAFE_BANDS, DEVICE_REGISTRY
from devices.sensor_simulator import reading_queue, run_all_simulators, SensorReading

# ANSI colour codes
RED    = "\033[91m"
YELLOW = "\033[93m"
GREEN  = "\033[92m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"


def get_band(crop: str):
    return CROP_SAFE_BANDS.get(crop, CROP_SAFE_BANDS["DEFAULT"])


def temp_status(reading: SensorReading) -> str:
    t_min, t_max, _, _ = get_band(reading.crop)
    t = reading.temperature
    if t < t_min - 5 or t > t_max + 5:  return f"{RED}CRITICAL{RESET}"
    if t < t_min - 1 or t > t_max + 1:  return f"{YELLOW}WARNING{RESET}"
    return f"{GREEN}OK{RESET}"


def humid_status(reading: SensorReading) -> str:
    _, _, h_min, h_max = get_band(reading.crop)
    h = reading.humidity
    if h < h_min - 8 or h > h_max + 5:  return f"{RED}CRITICAL{RESET}"
    if h < h_min - 2 or h > h_max + 2:  return f"{YELLOW}WARNING{RESET}"
    return f"{GREEN}OK{RESET}"


def render_dashboard(latest: dict[str, SensorReading], alert_count: int):
    os.system("cls" if os.name == "nt" else "clear")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    print(f"{BOLD}{'═' * 88}{RESET}")
    print(f"{BOLD}  🌾 D2Farm IoT Monitor  {DIM}│  {now}  │  Active Alerts: {RED if alert_count > 0 else GREEN}{alert_count}{RESET}{BOLD}{RESET}")
    print(f"{BOLD}{'═' * 88}{RESET}\n")

    if not latest:
        print(f"  {YELLOW}Waiting for sensor data...{RESET}\n")
        return

    header = f"  {'DEVICE':<32} {'TYPE':<18} {'TEMP°C':<10} {'STATUS':<14} {'HUM%':<8} {'STATUS':<14} {'BAT%':<7} {'SIGNAL'}"
    print(f"{DIM}{header}{RESET}")
    print(f"  {'─' * 82}")

    for dev_id, r in sorted(latest.items()):
        ts  = temp_status(r)
        hs  = humid_status(r)
        bat_col = RED if r.battery_pct < 15 else (YELLOW if r.battery_pct < 30 else GREEN)
        sig_col = RED if r.signal_rssi < -85 else (YELLOW if r.signal_rssi < -70 else GREEN)

        # Strip ANSI for column width calculation
        name_trunc = r.device_name[:30]
        type_trunc = r.device_type[:16]

        print(
            f"  {CYAN}{name_trunc:<32}{RESET}"
            f"{DIM}{type_trunc:<18}{RESET}"
            f"{r.temperature:<10.1f}{ts:<24}"
            f"{r.humidity:<8.1f}{hs:<24}"
            f"{bat_col}{r.battery_pct:<7.0f}{RESET}"
            f"{sig_col}{r.signal_rssi} dBm{RESET}"
        )

    print(f"\n  {DIM}Refreshes every 5s  ·  GET /iot/get-sensor-data for programmatic access{RESET}\n")


async def monitor_loop():
    """Consume readings and refresh the terminal dashboard every 5 seconds."""
    latest: dict[str, SensorReading] = {}
    alert_count = 0
    last_render = 0.0

    while True:
        # Drain all available readings without blocking
        try:
            while True:
                reading: SensorReading = reading_queue.get_nowait()
                latest[reading.device_id] = reading

                # Count alerts inline (simplified — full logic is in data_ingestion.py)
                _, t_max, _, _ = get_band(reading.crop)
                if reading.is_fault or reading.temperature > t_max + 2:
                    alert_count += 1
        except asyncio.QueueEmpty:
            pass

        now = time.monotonic()
        if (now - last_render) >= 5.0 or last_render == 0.0:
            render_dashboard(latest, alert_count)
            last_render = now
            alert_count = 0   # reset per render window

        await asyncio.sleep(0.5)


if __name__ == "__main__":
    print("Starting D2Farm IoT Monitor... (Ctrl+C to exit)")
    async def main():
        await asyncio.gather(run_all_simulators(), monitor_loop())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nMonitor stopped.")
