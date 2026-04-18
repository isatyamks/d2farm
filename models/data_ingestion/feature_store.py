import json
import logging
import time
from typing import Optional, Dict, Any, List
import redis

logger = logging.getLogger(__name__)

DEFAULT_TTL_SECONDS = 3600


class FeatureStoreConnector:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self._client = redis.Redis.from_url(redis_url, decode_responses=True)
        self._ttl = DEFAULT_TTL_SECONDS
        logger.info(f"[FeatureStore] Connected → {redis_url}")

    def _key(self, *parts: str) -> str:
        return ":".join(["features"] + list(parts))

    def set_feature_vector(self, namespace: str, entity_id: str, features: Dict[str, Any], ttl: Optional[int] = None):
        key = self._key(namespace, entity_id)
        payload = json.dumps(features)
        self._client.set(key, payload, ex=ttl or self._ttl)
        logger.debug(f"[FeatureStore] SET {key} ({len(features)} features)")

    def get_feature_vector(self, namespace: str, entity_id: str) -> Optional[Dict[str, Any]]:
        key = self._key(namespace, entity_id)
        raw = self._client.get(key)
        if raw is None:
            logger.warning(f"[FeatureStore] MISS {key}")
            return None
        logger.debug(f"[FeatureStore] HIT {key}")
        return json.loads(raw)

    def get_crop_price_features(self, crop_code: str, window_days: int = 7) -> Optional[Dict]:
        return self.get_feature_vector("crop", f"{crop_code}:{window_days}d")

    def set_crop_price_features(self, crop_code: str, window_days: int, features: Dict):
        self.set_feature_vector("crop", f"{crop_code}:{window_days}d", features)

    def get_farmer_reliability_vector(self, farmer_id: str) -> Optional[Dict]:
        return self.get_feature_vector("farmer", f"{farmer_id}:reliability")

    def update_farmer_reliability(self, farmer_id: str, delivery_rate: float, trust_score: float, total_proposals: int):
        features = {
            "delivery_completion_rate": delivery_rate,
            "trust_score": trust_score,
            "total_proposals": total_proposals,
            "computed_at": time.time(),
        }
        self.set_feature_vector("farmer", f"{farmer_id}:reliability", features, ttl=86400)
        logger.info(f"[FeatureStore] Updated reliability for farmer {farmer_id}")

    def invalidate_crop_features(self, crop_code: str):
        pattern = self._key("crop", f"{crop_code}:*")
        keys = self._client.keys(pattern)
        if keys:
            self._client.delete(*keys)
            logger.info(f"[FeatureStore] Invalidated {len(keys)} keys for crop {crop_code}")

    def batch_get(self, namespace: str, entity_ids: List[str]) -> Dict[str, Optional[Dict]]:
        keys = [self._key(namespace, eid) for eid in entity_ids]
        pipe = self._client.pipeline()
        for k in keys:
            pipe.get(k)
        raw_results = pipe.execute()
        return {
            eid: json.loads(raw) if raw else None
            for eid, raw in zip(entity_ids, raw_results)
        }
