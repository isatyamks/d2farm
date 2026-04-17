"""
Spoilage Risk Predictor
=======================
Predicts crop spoilage probability during transit based on perishability,
temperature, humidity, transit duration, and packaging.

Used by:
    - TransportLogistics (buyer dashboard → spoilage risk badge)
    - RouteOptimizer (cold-chain routing decisions)
    - DeepTechEngine (farmer app → transport recommendations)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

MODEL_DIR = os.path.dirname(__file__)
SPOILAGE_MODEL = os.path.join(MODEL_DIR, 'artifacts', 'spoilage_model.pkl')
SPOILAGE_SCALER = os.path.join(MODEL_DIR, 'artifacts', 'spoilage_scaler.pkl')

# Perishability profiles — from ICAR post-harvest management guides
CROP_PERISHABILITY = {
    'Tomato':   {'factor': 0.92, 'shelf_days_ambient': 6,  'shelf_days_cold': 14, 'ideal_temp': (8, 12)},
    'Onion':    {'factor': 0.38, 'shelf_days_ambient': 120, 'shelf_days_cold': 180, 'ideal_temp': (0, 4)},
    'Potato':   {'factor': 0.22, 'shelf_days_ambient': 60,  'shelf_days_cold': 240, 'ideal_temp': (4, 8)},
    'Capsicum': {'factor': 0.88, 'shelf_days_ambient': 5,   'shelf_days_cold': 14, 'ideal_temp': (7, 10)},
    'Mango':    {'factor': 0.90, 'shelf_days_ambient': 3,   'shelf_days_cold': 12, 'ideal_temp': (10, 13)},
    'Banana':   {'factor': 0.85, 'shelf_days_ambient': 5,   'shelf_days_cold': 10, 'ideal_temp': (13, 15)},
    'Wheat':    {'factor': 0.04, 'shelf_days_ambient': 365, 'shelf_days_cold': 730, 'ideal_temp': (10, 25)},
    'Rice':     {'factor': 0.05, 'shelf_days_ambient': 365, 'shelf_days_cold': 730, 'ideal_temp': (10, 25)},
    'Turmeric': {'factor': 0.08, 'shelf_days_ambient': 180, 'shelf_days_cold': 365, 'ideal_temp': (15, 25)},
    'Ginger':   {'factor': 0.35, 'shelf_days_ambient': 30,  'shelf_days_cold': 90,  'ideal_temp': (10, 13)},
    'Garlic':   {'factor': 0.15, 'shelf_days_ambient': 120, 'shelf_days_cold': 240, 'ideal_temp': (0, 4)},
    'Chana':    {'factor': 0.04, 'shelf_days_ambient': 365, 'shelf_days_cold': 730, 'ideal_temp': (10, 25)},
}


class SpoilageRiskPredictor:
    """
    Predicts spoilage percentage during transit.

    Input Features:
        - perishability_factor  : Crop-specific decay rate (0-1)
        - ambient_temp_c        : Average ambient temperature during transit (°C)
        - humidity_pct          : Relative humidity (%)
        - transit_hours         : Total transit duration (hours)
        - distance_km           : Route distance (km)
        - is_refrigerated       : Binary (cold transport / ambient)
        - packaging_quality     : 0=open, 0.5=crates, 1.0=sealed+cushioned
        - road_quality          : 0=kutcha, 0.5=state road, 1.0=national highway
        - days_since_harvest    : Days between harvest and dispatch

    Output:
        Spoilage risk percentage and cold-chain recommendation
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.feature_names = [
            'perishability_factor', 'ambient_temp_c', 'humidity_pct',
            'transit_hours', 'distance_km', 'is_refrigerated',
            'packaging_quality', 'road_quality', 'days_since_harvest'
        ]

    def _generate_training_data(self, n_samples=15000):
        """Generate synthetic spoilage data calibrated to ICAR loss reports."""
        np.random.seed(42)

        perishability = np.random.uniform(0.02, 0.95, n_samples)
        temp = np.random.normal(32, 10, n_samples).clip(5, 50)
        humidity = np.random.normal(65, 15, n_samples).clip(20, 98)
        transit_hrs = np.random.exponential(8, n_samples).clip(1, 48)
        distance = np.random.exponential(100, n_samples).clip(5, 800)
        refrigerated = np.random.binomial(1, 0.25, n_samples)
        packaging = np.random.choice([0, 0.5, 1.0], n_samples, p=[0.30, 0.45, 0.25])
        road_quality = np.random.choice([0, 0.5, 1.0], n_samples, p=[0.20, 0.45, 0.35])
        days_harvest = np.random.exponential(2, n_samples).clip(0, 14)

        # Spoilage model (physics-inspired):
        # Temperature stress: exponential increase above 25°C for perishables
        temp_stress = np.maximum(0, (temp - 25) * 0.025) * perishability

        # Time stress: logarithmic decay with transit duration
        time_stress = (transit_hrs / 24) * 0.12 * perishability

        # Humidity stress: high humidity accelerates fungal decay
        humidity_stress = np.maximum(0, (humidity - 70) / 100) * 0.08 * perishability

        # Vibration damage from poor roads
        vibration_damage = (1 - road_quality) * 0.04 * perishability

        # Packaging protection
        packaging_protection = packaging * 0.08

        # Refrigeration protection (halves spoilage)
        cold_protection = refrigerated * 0.5

        # Pre-harvest age
        age_factor = (days_harvest / 14) * 0.06 * perishability

        spoilage_pct = (
            3.0  # Base spoilage (handling losses)
            + temp_stress * 100
            + time_stress * 100
            + humidity_stress * 100
            + vibration_damage * 100
            + age_factor * 100
            - packaging_protection * 100
        ) * (1 - cold_protection)

        spoilage_pct += np.random.normal(0, 2, n_samples)
        spoilage_pct = np.clip(spoilage_pct, 0, 95)

        df = pd.DataFrame({
            'perishability_factor': perishability.round(3),
            'ambient_temp_c': temp.round(1),
            'humidity_pct': humidity.round(1),
            'transit_hours': transit_hrs.round(1),
            'distance_km': distance.round(0),
            'is_refrigerated': refrigerated,
            'packaging_quality': packaging,
            'road_quality': road_quality,
            'days_since_harvest': days_harvest.round(1),
            'spoilage_pct': spoilage_pct.round(1),
        })
        return df

    def train(self, save=True):
        """Train the spoilage prediction model."""
        print("🧠 [SpoilageRisk] Generating 15,000 transit scenarios...")
        df = self._generate_training_data()

        X = df[self.feature_names]
        y = df['spoilage_pct']

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        print("🌲 Training RandomForest (150 trees, depth=12)...")
        self.model = RandomForestRegressor(
            n_estimators=150, max_depth=12, min_samples_leaf=5,
            random_state=42, n_jobs=-1
        )
        self.model.fit(X_scaled, y)

        y_pred = self.model.predict(X_scaled)
        mae = np.mean(np.abs(y - y_pred))
        print(f"✅ Spoilage MAE: {mae:.2f}%")

        self.is_trained = True

        if save:
            os.makedirs(os.path.join(MODEL_DIR, 'artifacts'), exist_ok=True)
            joblib.dump(self.model, SPOILAGE_MODEL)
            joblib.dump(self.scaler, SPOILAGE_SCALER)

        return {'mae': mae}

    def load(self):
        if not os.path.exists(SPOILAGE_MODEL):
            self.train()
            return
        self.model = joblib.load(SPOILAGE_MODEL)
        self.scaler = joblib.load(SPOILAGE_SCALER)
        self.is_trained = True

    def predict(self, crop_name, ambient_temp_c=32, humidity_pct=65,
                transit_hours=8, distance_km=100, is_refrigerated=False,
                packaging_quality=0.5, road_quality=0.5, days_since_harvest=1):
        """
        Predict spoilage risk for a shipment.

        Returns:
            dict with spoilage_pct, risk_level, cold_chain_recommendation
        """
        if not self.is_trained:
            self.load()

        crop_info = CROP_PERISHABILITY.get(crop_name, {'factor': 0.5, 'ideal_temp': (10, 20)})

        features = np.array([[
            crop_info['factor'], ambient_temp_c, humidity_pct,
            transit_hours, distance_km, int(is_refrigerated),
            packaging_quality, road_quality, days_since_harvest
        ]])
        features_scaled = self.scaler.transform(features)
        spoilage = self.model.predict(features_scaled)[0]
        spoilage = np.clip(spoilage, 0, 95)

        # Risk level
        if spoilage > 30:
            risk = 'HIGH'
        elif spoilage > 15:
            risk = 'MEDIUM'
        else:
            risk = 'LOW'

        # Cold-chain recommendation
        needs_cold = (
            crop_info['factor'] > 0.5
            and transit_hours > 4
            and ambient_temp_c > crop_info['ideal_temp'][1] + 5
        )

        # Financial loss estimate (using base price and spoilage %)
        est_loss_per_ton = round(spoilage * 10, 0)  # Rough ₹ per ton

        return {
            'spoilage_risk_pct': round(spoilage, 1),
            'risk_level': risk,
            'cold_chain_needed': needs_cold or is_refrigerated,
            'ideal_temp_range': f"{crop_info['ideal_temp'][0]}–{crop_info['ideal_temp'][1]}°C",
            'shelf_life': {
                'ambient': f"{crop_info.get('shelf_days_ambient', 'N/A')} days",
                'cold_storage': f"{crop_info.get('shelf_days_cold', 'N/A')} days",
            },
            'stressor': (
                f"High temp ({ambient_temp_c}°C)" if ambient_temp_c > 35
                else f"Long transit ({transit_hours}h)" if transit_hours > 12
                else f"High humidity ({humidity_pct}%)" if humidity_pct > 80
                else "Normal conditions"
            ),
            'est_loss_per_ton_inr': est_loss_per_ton,
            'mitigation': (
                "Use refrigerated vehicle + pre-cool cargo"
                if needs_cold and not is_refrigerated
                else "Cold-chain active — risk managed"
                if is_refrigerated
                else "Ambient transit OK for this distance"
            ),
        }


if __name__ == "__main__":
    model = SpoilageRiskPredictor()
    model.train(save=False)

    print("\n=== Tomato: 8hr transit, 38°C, no refrigeration ===")
    r = model.predict('Tomato', ambient_temp_c=38, transit_hours=8, distance_km=150)
    print(f"   Spoilage: {r['spoilage_risk_pct']}% [{r['risk_level']}]")
    print(f"   Cold chain: {'NEEDED' if r['cold_chain_needed'] else 'Not required'}")
    print(f"   Stressor: {r['stressor']}")

    print("\n=== Wheat: 24hr transit, 30°C, no refrigeration ===")
    r = model.predict('Wheat', ambient_temp_c=30, transit_hours=24, distance_km=500)
    print(f"   Spoilage: {r['spoilage_risk_pct']}% [{r['risk_level']}]")
    print(f"   Cold chain: {'NEEDED' if r['cold_chain_needed'] else 'Not required'}")
