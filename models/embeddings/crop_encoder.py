import numpy as np
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


CROP_CATEGORY_MAP: Dict[str, int] = {
    "tomato": 0, "onion": 1, "potato": 2, "capsicum": 3,
    "spinach": 4, "cabbage": 5, "brinjal": 6, "ladyfinger": 7,
    "mango": 8, "banana": 9, "wheat": 10, "rice": 11,
}

QUALITY_GRADE_MAP: Dict[str, int] = {"A": 2, "B": 1, "C": 0, "REJECTED": -1}
VARIETY_HASH_BINS = 32


@dataclass
class CropEmbedding:
    listing_id: str
    vector: np.ndarray
    crop_code: str
    farmer_id: str


class CropEncoder:
    OUTPUT_DIM = 64

    def __init__(self, projection_weights: Optional[np.ndarray] = None):
        raw_dim = len(CROP_CATEGORY_MAP) + 6
        if projection_weights is not None:
            assert projection_weights.shape == (raw_dim, self.OUTPUT_DIM)
            self.W = projection_weights
        else:
            rng = np.random.RandomState(42)
            self.W = rng.randn(raw_dim, self.OUTPUT_DIM).astype(np.float32) / np.sqrt(raw_dim)
        logger.info(f"[CropEncoder] Ready — raw_dim={raw_dim}, output_dim={self.OUTPUT_DIM}")

    def _one_hot_crop(self, crop_name: str) -> np.ndarray:
        vec = np.zeros(len(CROP_CATEGORY_MAP))
        idx = CROP_CATEGORY_MAP.get(crop_name.lower())
        if idx is not None:
            vec[idx] = 1.0
        return vec

    def _encode_variety(self, variety: str) -> float:
        return (hash(variety.lower()) % VARIETY_HASH_BINS) / VARIETY_HASH_BINS

    def _normalise_numerics(self, listing: Dict[str, Any]) -> np.ndarray:
        price      = float(listing.get("price_per_unit", 20.0)) / 200.0
        quantity   = min(float(listing.get("quantity_kg", 100.0)) / 10_000, 1.0)
        harvest_d  = min(float(listing.get("days_to_harvest", 5)) / 30.0, 1.0)
        lat        = float(listing.get("lat", 22.0)) / 90.0
        lng        = float(listing.get("lng", 78.0)) / 180.0
        quality    = (QUALITY_GRADE_MAP.get(listing.get("quality_grade", "B"), 1) + 1) / 3.0
        return np.array([price, quantity, harvest_d, lat, lng, quality], dtype=np.float32)

    def encode(self, listing: Dict[str, Any]) -> CropEmbedding:
        crop_vec  = self._one_hot_crop(listing.get("crop_name", ""))
        num_vec   = self._normalise_numerics(listing)
        raw = np.concatenate([crop_vec, num_vec]).astype(np.float32)
        projected = raw @ self.W
        norm = np.linalg.norm(projected)
        vector = projected / (norm + 1e-8)
        return CropEmbedding(
            listing_id=listing.get("listing_id", "unknown"),
            vector=vector,
            crop_code=listing.get("crop_name", "").lower(),
            farmer_id=listing.get("farmer_id", ""),
        )

    def encode_batch(self, listings: List[Dict[str, Any]]) -> List[CropEmbedding]:
        return [self.encode(l) for l in listings]
