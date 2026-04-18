import json
import logging
import threading
from typing import Callable, Optional
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

TOPIC_TELEMETRY   = "d2farm/fleet/{truck_id}/telemetry"
TOPIC_ALERT       = "d2farm/fleet/{truck_id}/alert"
TOPIC_HEARTBEAT   = "d2farm/fleet/+/heartbeat"


class MQTTBridgeClient:
    def __init__(
        self,
        broker_host: str,
        broker_port: int = 1883,
        client_id: str = "d2farm-telemetry-bridge",
        on_telemetry: Optional[Callable] = None,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.on_telemetry = on_telemetry
        self._connected = threading.Event()

        self.client = mqtt.Client(client_id=client_id)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"[MQTT] Connected to broker at {self.broker_host}:{self.broker_port}")
            client.subscribe(TOPIC_HEARTBEAT)
            client.subscribe("d2farm/fleet/+/telemetry")
            self._connected.set()
        else:
            logger.error(f"[MQTT] Connection refused — return code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"[MQTT] Disconnected (rc={rc}). Attempting reconnect...")
        self._connected.clear()

    def _on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode("utf-8"))
            logger.debug(f"[MQTT] {topic} → {payload}")

            if "/telemetry" in topic:
                truck_id = topic.split("/")[2]
                payload["truck_id"] = truck_id
                if callable(self.on_telemetry):
                    self.on_telemetry(payload)

            elif "/heartbeat" in topic:
                truck_id = topic.split("/")[2]
                logger.info(f"[MQTT] Heartbeat received from truck {truck_id} — uptime {payload.get('uptime_s', '?')}s")

        except (json.JSONDecodeError, IndexError) as e:
            logger.error(f"[MQTT] Failed to parse message on {msg.topic}: {e}")

    def connect(self, timeout: int = 10) -> bool:
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
            connected = self._connected.wait(timeout=timeout)
            if not connected:
                logger.error("[MQTT] Connection timed out.")
            return connected
        except Exception as e:
            logger.error(f"[MQTT] Exception during connect: {e}")
            return False

    def publish_alert(self, truck_id: str, alert_payload: dict):
        topic = TOPIC_ALERT.format(truck_id=truck_id)
        self.client.publish(topic, json.dumps(alert_payload), qos=1)
        logger.info(f"[MQTT] Alert published to {topic}")

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("[MQTT] Disconnected cleanly.")
