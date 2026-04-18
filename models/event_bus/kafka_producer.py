import json
import logging
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, Optional
from confluent_kafka import Producer, KafkaException

logger = logging.getLogger(__name__)

TOPIC_TELEMETRY_RAW    = "d2farm.telemetry.raw"
TOPIC_PROPOSALS        = "d2farm.proposals.created"
TOPIC_LOGISTICS        = "d2farm.logistics.dispatch"
TOPIC_ESCROW           = "d2farm.escrow.events"


@dataclass
class DomainEvent:
    event_type: str
    source: str
    payload: Dict[str, Any]
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


class D2FarmKafkaProducer:
    def __init__(self, bootstrap_servers: str, **kwargs):
        config = {
            "bootstrap.servers": bootstrap_servers,
            "client.id": "d2farm-core-producer",
            "acks": "all",
            "retries": 5,
            "retry.backoff.ms": 300,
            **kwargs,
        }
        self._producer = Producer(config)
        logger.info(f"[KafkaProducer] Initialised → brokers={bootstrap_servers}")

    def _delivery_report(self, err, msg):
        if err:
            logger.error(f"[KafkaProducer] Delivery failed to {msg.topic()}: {err}")
        else:
            logger.debug(f"[KafkaProducer] Delivered → {msg.topic()} [p={msg.partition()} o={msg.offset()}]")

    def _publish(self, topic: str, event: DomainEvent, key: Optional[str] = None):
        try:
            payload_bytes = json.dumps(asdict(event)).encode("utf-8")
            key_bytes = key.encode("utf-8") if key else None
            self._producer.produce(
                topic,
                value=payload_bytes,
                key=key_bytes,
                callback=self._delivery_report,
            )
            self._producer.poll(0)
        except KafkaException as e:
            logger.error(f"[KafkaProducer] Failed to publish to {topic}: {e}")

    def emit_telemetry(self, truck_id: str, sensor_payload: Dict):
        event = DomainEvent(event_type="TELEMETRY_INGESTED", source=truck_id, payload=sensor_payload)
        self._publish(TOPIC_TELEMETRY_RAW, event, key=truck_id)

    def emit_proposal_created(self, proposal_id: str, farmer_id: str, buyer_id: str, crop: str):
        event = DomainEvent(
            event_type="PROPOSAL_CREATED",
            source="matching_engine",
            payload={"proposal_id": proposal_id, "farmer_id": farmer_id, "buyer_id": buyer_id, "crop": crop},
        )
        self._publish(TOPIC_PROPOSALS, event, key=proposal_id)

    def emit_escrow_event(self, contract_id: str, event_type: str, amount_inr: float):
        event = DomainEvent(
            event_type=event_type,
            source="ledger_service",
            payload={"contract_id": contract_id, "amount_inr": amount_inr},
        )
        self._publish(TOPIC_ESCROW, event, key=contract_id)

    def flush(self, timeout: float = 10.0):
        remaining = self._producer.flush(timeout=timeout)
        if remaining > 0:
            logger.warning(f"[KafkaProducer] {remaining} messages still in queue after flush.")
