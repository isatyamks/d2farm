import time
import logging
from prometheus_client import (
    Counter, Histogram, Gauge,
    start_http_server,
)

logger = logging.getLogger(__name__)

MODEL_INFERENCE_LATENCY = Histogram(
    "d2farm_model_inference_latency_seconds",
    "End-to-end inference latency per model",
    labelnames=["model_name"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

TELEMETRY_EVENTS = Counter(
    "d2farm_telemetry_events_total",
    "Total IoT telemetry events processed",
    labelnames=["verdict", "crop_type"],
)

COLD_CHAIN_BREACH_RATE = Gauge(
    "d2farm_cold_chain_breach_rate",
    "Rolling 1-hour breach rate per crop type",
    labelnames=["crop_type"],
)

PROPOSAL_MATCH_RATE = Gauge(
    "d2farm_proposal_match_rate_percent",
    "Percentage of buyer demand requests successfully matched to farmers",
)

FEATURE_CACHE_HIT = Counter(
    "d2farm_feature_store_cache_hits_total",
    "Feature store Redis cache hit count",
    labelnames=["namespace"],
)

FEATURE_CACHE_MISS = Counter(
    "d2farm_feature_store_cache_misses_total",
    "Feature store Redis cache miss count",
    labelnames=["namespace"],
)

ESCROW_EVENTS = Counter(
    "d2farm_escrow_events_total",
    "Smart contract escrow lifecycle events",
    labelnames=["event_type"],
)

ACTIVE_TRUCK_SENSORS = Gauge(
    "d2farm_active_truck_sensors",
    "Number of IoT-connected trucks actively reporting telemetry",
)


class InferenceTimer:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self._start: float = 0.0

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *args):
        elapsed = time.perf_counter() - self._start
        MODEL_INFERENCE_LATENCY.labels(model_name=self.model_name).observe(elapsed)
        logger.debug(f"[Prometheus] {self.model_name} inference: {elapsed*1000:.1f}ms")


def record_telemetry_event(verdict: str, crop_type: str):
    TELEMETRY_EVENTS.labels(verdict=verdict, crop_type=crop_type).inc()

def update_breach_rate(crop_type: str, rate: float):
    COLD_CHAIN_BREACH_RATE.labels(crop_type=crop_type).set(rate)

def update_match_rate(rate_pct: float):
    PROPOSAL_MATCH_RATE.set(rate_pct)

def record_feature_cache_hit(namespace: str):
    FEATURE_CACHE_HIT.labels(namespace=namespace).inc()

def record_feature_cache_miss(namespace: str):
    FEATURE_CACHE_MISS.labels(namespace=namespace).inc()

def record_escrow_event(event_type: str):
    ESCROW_EVENTS.labels(event_type=event_type).inc()

def set_active_truck_count(count: int):
    ACTIVE_TRUCK_SENSORS.set(count)

def start_metrics_server(port: int = 9090):
    start_http_server(port)
    logger.info(f"[Prometheus] Metrics server listening on :{port}/metrics")
