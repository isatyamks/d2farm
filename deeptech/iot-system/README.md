# IoT System — D2Farm Deep Tech Layer

## Purpose
Provides real-time cold-chain and transport monitoring for agricultural supply chains:
- **Temperature & humidity tracking** — continuous sensor readings from storage facilities and transport vehicles
- **Threshold alerting** — automatic alerts when conditions exceed safe ranges (temperature, humidity, shock)
- **Spoilage risk scoring** — real-time risk calculation per consignment
- **Dashboard streaming** — live WebSocket feed consumable by the main frontend

## Why It Exists
Perishable crops (tomatoes, mangoes, leafy greens) lose 20–40% of value due to inadequate cold-chain management. This module provides the data layer to detect and prevent spoilage events before they happen — reducing waste and protecting escrow payouts.

## Tech Stack
- **Python 3.11+** — sensor simulation and data pipeline
- **asyncio + websockets** — async streaming
- **paho-mqtt** — production MQTT broker integration path
- **FastAPI** — REST API for dashboard queries
- **Redis** (optional) — time-series buffer for high-frequency sensor data

## Structure
```
/iot-system
├── /devices
│   └── sensor_simulator.py    ← Simulates temperature/humidity sensors
├── /services
│   └── data_ingestion.py      ← Receives, validates, and stores sensor readings
├── /dashboard
│   └── monitor.py             ← Real-time alerting + WebSocket broadcast
├── config.py                  ← All thresholds and device registry
└── README.md
```

## Integration Plan
Once validated, this system feeds data to the main backend via:
```
GET  /iot/get-sensor-data          ← Latest readings for all devices
GET  /iot/get-sensor-data/:id      ← Readings for a specific shipment
POST /iot/acknowledge-alert        ← Mark an alert as resolved
WS   /iot/stream                   ← WebSocket real-time stream
```

The `OrderTracking` view in the frontend will poll `/iot/get-sensor-data` to show live cold-chain status next to each order.

## Running Locally
```bash
pip install -r requirements.txt

# Terminal 1: Start sensor simulator (generates readings every 5s)
python devices/sensor_simulator.py

# Terminal 2: Start ingestion + alert service
python services/data_ingestion.py

# Terminal 3: Start monitoring dashboard
python dashboard/monitor.py
```

## Current Limitations
- Sensors are simulated via Python random walks — no physical hardware connected yet
- MQTT broker integration is stubbed (commented out) — will connect to AWS IoT Core in v2
- Redis buffer not required at current scale — in-memory deque used instead
- WebSocket stream is local only — will be proxied through main backend in v2
