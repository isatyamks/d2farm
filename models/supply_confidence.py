"""
Supply Confidence Scorer
========================
Farmer reliability and yield estimation model for D2Farm's
multi-farmer allocation system.

Scores each farmer on their likelihood of fulfilling a commitment,
used to:
    - Weight allocation in the matching engine
    - Set over-allocation buffers per farmer
    - Determine deposit requirements

Used by:
    - FarmerProfile (farmer app → trust score)
    - FarmerProposals (buyer dashboard → reliability indicator)
    - MatchingEngine (allocation weight)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

MODEL_DIR = os.path.dirname(__file__)
SUPPLY_MODEL = os.path.join(MODEL_DIR, 'artifacts', 'supply_confidence.pkl')
SUPPLY_SCALER = os.path.join(MODEL_DIR, 'artifacts', 'supply_scaler.pkl')

# Region-wise agricultural reliability data (from NABARD District Reports)
REGION_PROFILES = {
    'MP_Indore':      {'base_reliability': 0.82, 'irrigation_pct': 65, 'avg_holding_acres': 3.2},
    'MP_Bhopal':      {'base_reliability': 0.78, 'irrigation_pct': 55, 'avg_holding_acres': 2.8},
    'MP_Sehore':      {'base_reliability': 0.75, 'irrigation_pct': 48, 'avg_holding_acres': 2.5},
    'UP_Lucknow':     {'base_reliability': 0.80, 'irrigation_pct': 72, 'avg_holding_acres': 1.8},
    'UP_Kanpur':      {'base_reliability': 0.77, 'irrigation_pct': 68, 'avg_holding_acres': 2.0},
    'UP_Agra':        {'base_reliability': 0.83, 'irrigation_pct': 75, 'avg_holding_acres': 2.2},
    'UP_Varanasi':    {'base_reliability': 0.74, 'irrigation_pct': 60, 'avg_holding_acres': 1.5},
    'Bihar_Patna':    {'base_reliability': 0.70, 'irrigation_pct': 50, 'avg_holding_acres': 1.2},
    'Bihar_Muzaffarpur': {'base_reliability': 0.68, 'irrigation_pct': 42, 'avg_holding_acres': 1.0},
    'Bihar_Nalanda':  {'base_reliability': 0.72, 'irrigation_pct': 55, 'avg_holding_acres': 1.3},
    'Maharashtra_Nashik': {'base_reliability': 0.85, 'irrigation_pct': 70, 'avg_holding_acres': 3.5},
}


class SupplyConfidenceScorer:
    """
    Predicts probability that a farmer will fulfill their listed
    supply commitment (fully/partially/default).

    Input Features:
        - past_fulfillment_rate   : Historical delivery rate (0-1)
        - total_past_orders       : Number of past transactions
        - farm_size_acres         : Total farm area
        - irrigation_available    : Binary (irrigated/rainfed)
        - crop_diversity          : Number of crops grown
        - days_on_platform        : Platform tenure
        - region_reliability      : District-level base score
        - current_weather_risk    : 0=normal, 1=moderate, 2=severe
        - distance_to_hub_km     : Distance to nearest aggregation hub
        - kyc_verified            : Binary (blockchain KYC done)
        - listing_accuracy_pct   : Past listing vs actual delivery accuracy

    Output:
        Confidence tier: HIGH (>80%), MODERATE (60-80%), LOW (<60%)
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.feature_names = [
            'past_fulfillment_rate', 'total_past_orders', 'farm_size_acres',
            'irrigation_available', 'crop_diversity', 'days_on_platform',
            'region_reliability', 'current_weather_risk', 'distance_to_hub_km',
            'kyc_verified', 'listing_accuracy_pct'
        ]

    def _generate_training_data(self, n_samples=18000):
        """Generate synthetic farmer reliability data based on NABARD district profiles."""
        np.random.seed(42)

        # Sample region profiles
        regions = list(REGION_PROFILES.values())
        region_indices = np.random.randint(0, len(regions), n_samples)
        region_data = [regions[i] for i in region_indices]
        region_reliability = np.array([r['base_reliability'] for r in region_data])

        past_fulfill = np.random.beta(4, 1.5, n_samples).clip(0.1, 1.0)
        total_orders = np.random.geometric(0.08, n_samples).clip(0, 100)
        farm_size = np.array([r['avg_holding_acres'] for r in region_data])
        farm_size *= np.random.uniform(0.5, 2, n_samples)  # Variation
        irrigation = np.random.binomial(1, [r['irrigation_pct'] / 100 for r in region_data])
        crop_diversity = np.random.poisson(2.5, n_samples).clip(1, 8)
        days_platform = np.random.exponential(120, n_samples).clip(1, 730).astype(int)
        weather_risk = np.random.choice([0, 1, 2], n_samples, p=[0.6, 0.28, 0.12])
        distance_hub = np.random.exponential(25, n_samples).clip(1, 150)
        kyc_verified = np.random.binomial(1, 0.65, n_samples)
        listing_accuracy = np.random.beta(5, 2, n_samples).clip(0.3, 1.0)

        # Fulfillment probability model:
        fulfillment_score = (
            past_fulfill * 0.30
            + (total_orders / 100) * 0.10
            + irrigation * 0.12
            + (1 - weather_risk / 2) * 0.15
            + kyc_verified * 0.08
            + listing_accuracy * 0.10
            + region_reliability * 0.10
            + np.clip(1 - distance_hub / 200, 0, 1) * 0.05
        )
        fulfillment_score += np.random.normal(0, 0.05, n_samples)
        fulfillment_score = np.clip(fulfillment_score, 0, 1)

        # Labels: 2=HIGH, 1=MODERATE, 0=LOW
        labels = np.where(fulfillment_score > 0.65, 2,
                 np.where(fulfillment_score > 0.45, 1, 0))

        df = pd.DataFrame({
            'past_fulfillment_rate': past_fulfill.round(3),
            'total_past_orders': total_orders,
            'farm_size_acres': farm_size.round(1),
            'irrigation_available': irrigation,
            'crop_diversity': crop_diversity,
            'days_on_platform': days_platform,
            'region_reliability': region_reliability.round(3),
            'current_weather_risk': weather_risk,
            'distance_to_hub_km': distance_hub.round(1),
            'kyc_verified': kyc_verified,
            'listing_accuracy_pct': listing_accuracy.round(3),
            'confidence_tier': labels,
        })
        return df

    def train(self, save=True):
        """Train the supply confidence scoring model."""
        print("🧠 [SupplyConfidence] Generating 18,000 farmer profiles...")
        df = self._generate_training_data()

        X = df[self.feature_names]
        y = df['confidence_tier']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        print("📈 Training GradientBoosting Classifier (200 stages)...")
        self.model = GradientBoostingClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.08,
            subsample=0.85, random_state=42
        )
        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)
        accuracy = (y_pred == y_test).mean()

        print(f"✅ Supply Confidence Accuracy: {accuracy:.4f}")
        print(classification_report(
            y_test, y_pred, target_names=['LOW', 'MODERATE', 'HIGH']
        ))

        self.is_trained = True

        if save:
            os.makedirs(os.path.join(MODEL_DIR, 'artifacts'), exist_ok=True)
            joblib.dump(self.model, SUPPLY_MODEL)
            joblib.dump(self.scaler, SUPPLY_SCALER)

        return {'accuracy': accuracy}

    def load(self):
        if not os.path.exists(SUPPLY_MODEL):
            self.train()
            return
        self.model = joblib.load(SUPPLY_MODEL)
        self.scaler = joblib.load(SUPPLY_SCALER)
        self.is_trained = True

    def score(self, past_fulfillment_rate, total_past_orders,
              farm_size_acres, irrigation_available=1,
              crop_diversity=3, days_on_platform=90,
              region_reliability=0.75, current_weather_risk=0,
              distance_to_hub_km=30, kyc_verified=1,
              listing_accuracy_pct=0.85):
        """
        Score a farmer's supply confidence.

        Returns:
            dict with tier, score_pct, allocation_weight, buffer_pct
        """
        if not self.is_trained:
            self.load()

        features = np.array([[
            past_fulfillment_rate, total_past_orders, farm_size_acres,
            irrigation_available, crop_diversity, days_on_platform,
            region_reliability, current_weather_risk, distance_to_hub_km,
            kyc_verified, listing_accuracy_pct
        ]])
        features_scaled = self.scaler.transform(features)

        tier_idx = self.model.predict(features_scaled)[0]
        probas = self.model.predict_proba(features_scaled)[0]

        TIER_NAMES = {0: 'LOW', 1: 'MODERATE', 2: 'HIGH'}
        tier = TIER_NAMES[tier_idx]

        # Score as percentage (weighted sum of tier probabilities)
        score_pct = round(probas[2] * 100, 1)

        # Allocation parameters
        BUFFER_MAP = {'HIGH': 10, 'MODERATE': 25, 'LOW': 40}
        WEIGHT_MAP = {'HIGH': 1.0, 'MODERATE': 0.7, 'LOW': 0.4}

        return {
            'farmer_tier': tier,
            'confidence_score': score_pct,
            'tier_probabilities': {
                'HIGH': round(probas[2] * 100, 1),
                'MODERATE': round(probas[1] * 100, 1),
                'LOW': round(probas[0] * 100, 1),
            },
            'allocation_weight': WEIGHT_MAP[tier],
            'recommended_buffer_pct': BUFFER_MAP[tier],
            'trust_badge': '🟢 Verified' if score_pct > 70 else '🟡 Standard' if score_pct > 40 else '🔴 New/Risky',
        }


if __name__ == "__main__":
    scorer = SupplyConfidenceScorer()
    scorer.train(save=False)

    print("\n=== Reliable MP Farmer (Nashik, irrigated, KYC done) ===")
    r = scorer.score(
        past_fulfillment_rate=0.92, total_past_orders=15,
        farm_size_acres=4.5, irrigation_available=1,
        region_reliability=0.85, kyc_verified=1
    )
    print(f"   Tier: {r['farmer_tier']} | Score: {r['confidence_score']}% | {r['trust_badge']}")
    print(f"   Allocation weight: {r['allocation_weight']}x | Buffer: {r['recommended_buffer_pct']}%")

    print("\n=== New Bihar Farmer (small, rainfed, no KYC) ===")
    r = scorer.score(
        past_fulfillment_rate=0.5, total_past_orders=1,
        farm_size_acres=1.0, irrigation_available=0,
        region_reliability=0.68, kyc_verified=0,
        current_weather_risk=2, distance_to_hub_km=80
    )
    print(f"   Tier: {r['farmer_tier']} | Score: {r['confidence_score']}% | {r['trust_badge']}")
    print(f"   Allocation weight: {r['allocation_weight']}x | Buffer: {r['recommended_buffer_pct']}%")
