"""
Crop Quality Classifier
=======================
Multi-factor crop quality grading model for D2Farm's proposal system.

Grades produce into: A (Premium), B (Standard), C (Below Average), Rejected
using visual, environmental, and handling features.

Used by:
    - Farmer CropListing (farmer app → quality auto-assessment)
    - Buyer FarmerProposals (buyer dashboard → quality verification)
    - Smart Contracts (quality-based pricing tiers)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

MODEL_DIR = os.path.dirname(__file__)
QUALITY_MODEL = os.path.join(MODEL_DIR, 'artifacts', 'crop_quality_clf.pkl')
QUALITY_SCALER = os.path.join(MODEL_DIR, 'artifacts', 'crop_quality_scaler.pkl')
QUALITY_ENCODER = os.path.join(MODEL_DIR, 'artifacts', 'crop_quality_encoder.pkl')

# Crop-specific quality thresholds (from FSSAI & APEDA grading standards)
QUALITY_STANDARDS = {
    'Tomato': {
        'ideal_moisture_pct': (85, 93),
        'ideal_size_cm': (5, 8),
        'max_blemish_pct': 5,
        'max_days_since_harvest': 3,
        'color_uniformity_min': 0.75,
    },
    'Onion': {
        'ideal_moisture_pct': (78, 84),
        'ideal_size_cm': (4, 7),
        'max_blemish_pct': 8,
        'max_days_since_harvest': 14,
        'color_uniformity_min': 0.70,
    },
    'Potato': {
        'ideal_moisture_pct': (75, 82),
        'ideal_size_cm': (4, 9),
        'max_blemish_pct': 10,
        'max_days_since_harvest': 30,
        'color_uniformity_min': 0.65,
    },
    'Wheat': {
        'ideal_moisture_pct': (10, 14),
        'ideal_size_cm': (0.5, 0.8),
        'max_blemish_pct': 2,
        'max_days_since_harvest': 180,
        'color_uniformity_min': 0.80,
    },
    'Rice': {
        'ideal_moisture_pct': (12, 16),
        'ideal_size_cm': (0.5, 1.0),
        'max_blemish_pct': 3,
        'max_days_since_harvest': 365,
        'color_uniformity_min': 0.85,
    },
}


class CropQualityClassifier:
    """
    Classifies crop quality into grade tiers based on physical and
    environmental parameters.

    Input Features:
        - moisture_pct         : Moisture content (%)
        - avg_size_cm          : Average produce size (cm)
        - blemish_pct          : Surface blemish/damage percentage
        - color_uniformity     : Color consistency score (0-1)
        - days_since_harvest   : Time since harvest (days)
        - transit_temp_avg     : Average transit temperature (°C)
        - handling_score       : Handling quality (0=rough, 1=careful)
        - pest_damage_pct      : Pest/insect damage (%)
        - foreign_matter_pct   : Foreign material contamination (%)

    Output:
        Grade: 'A' (Premium), 'B' (Standard), 'C' (Below Average), 'Rejected'
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoder = None
        self.is_trained = False
        self.feature_names = [
            'moisture_pct', 'avg_size_cm', 'blemish_pct',
            'color_uniformity', 'days_since_harvest', 'transit_temp_avg',
            'handling_score', 'pest_damage_pct', 'foreign_matter_pct'
        ]

    def _generate_training_data(self, n_samples=20000):
        """
        Generate synthetic crop quality data following FSSAI/APEDA
        grading standards for Indian agricultural produce.
        """
        np.random.seed(42)

        moisture = np.random.uniform(8, 95, n_samples)
        size = np.random.uniform(0.3, 12, n_samples)
        blemish = np.random.exponential(5, n_samples).clip(0, 50)
        color_unif = np.random.beta(5, 2, n_samples)
        days_harvest = np.random.exponential(10, n_samples).clip(0, 120).astype(int)
        transit_temp = np.random.normal(28, 8, n_samples).clip(2, 48)
        handling = np.random.beta(3, 2, n_samples)
        pest_dmg = np.random.exponential(2, n_samples).clip(0, 40)
        foreign_matter = np.random.exponential(1.5, n_samples).clip(0, 20)

        # Quality score calculation (composite)
        quality_score = (
            color_unif * 25                          # Color: 0-25 pts
            + np.clip((1 - blemish / 50), 0, 1) * 20  # Blemish: 0-20 pts
            + np.clip((1 - pest_dmg / 30), 0, 1) * 15  # Pest: 0-15 pts
            + handling * 15                           # Handling: 0-15 pts
            + np.clip((1 - days_harvest / 60), 0, 1) * 10  # Freshness: 0-10 pts
            + np.clip((1 - foreign_matter / 15), 0, 1) * 10  # Purity: 0-10 pts
            + np.clip((1 - np.abs(transit_temp - 15) / 30), 0, 1) * 5  # Temp: 0-5 pts
        )

        # Assign grades based on composite score
        grades = np.where(
            quality_score >= 75, 'A',
            np.where(
                quality_score >= 55, 'B',
                np.where(quality_score >= 35, 'C', 'Rejected')
            )
        )

        df = pd.DataFrame({
            'moisture_pct': moisture.round(1),
            'avg_size_cm': size.round(2),
            'blemish_pct': blemish.round(1),
            'color_uniformity': color_unif.round(3),
            'days_since_harvest': days_harvest,
            'transit_temp_avg': transit_temp.round(1),
            'handling_score': handling.round(3),
            'pest_damage_pct': pest_dmg.round(1),
            'foreign_matter_pct': foreign_matter.round(1),
            'grade': grades,
        })
        return df

    def train(self, save=True):
        """Train the quality classification model."""
        print("🧠 [CropQuality] Generating 20,000 training samples...")
        df = self._generate_training_data()

        X = df[self.feature_names]
        self.encoder = LabelEncoder()
        y = self.encoder.fit_transform(df['grade'])

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        print("🌲 Training RandomForest Classifier (300 trees)...")
        self.model = RandomForestClassifier(
            n_estimators=300, max_depth=16, min_samples_leaf=3,
            class_weight='balanced', random_state=42, n_jobs=-1
        )
        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)
        accuracy = (y_pred == y_test).mean()

        print(f"✅ Quality Model Accuracy: {accuracy:.4f}")
        print(f"\n📊 Classification Report:")
        print(classification_report(
            y_test, y_pred,
            target_names=self.encoder.classes_
        ))

        self.is_trained = True

        if save:
            os.makedirs(os.path.join(MODEL_DIR, 'artifacts'), exist_ok=True)
            joblib.dump(self.model, QUALITY_MODEL)
            joblib.dump(self.scaler, QUALITY_SCALER)
            joblib.dump(self.encoder, QUALITY_ENCODER)
            print(f"💾 Quality model saved to {MODEL_DIR}/artifacts/")

        return {'accuracy': accuracy}

    def load(self):
        """Load pre-trained model."""
        if not os.path.exists(QUALITY_MODEL):
            print("⚠️  No trained quality model found. Training...")
            self.train()
            return
        self.model = joblib.load(QUALITY_MODEL)
        self.scaler = joblib.load(QUALITY_SCALER)
        self.encoder = joblib.load(QUALITY_ENCODER)
        self.is_trained = True

    def predict(self, moisture_pct, avg_size_cm, blemish_pct,
                color_uniformity, days_since_harvest,
                transit_temp_avg=25, handling_score=0.7,
                pest_damage_pct=0, foreign_matter_pct=0):
        """
        Classify crop quality grade.

        Returns:
            dict with grade, confidence, price_multiplier, rejection_reasons
        """
        if not self.is_trained:
            self.load()

        features = np.array([[
            moisture_pct, avg_size_cm, blemish_pct,
            color_uniformity, days_since_harvest, transit_temp_avg,
            handling_score, pest_damage_pct, foreign_matter_pct
        ]])
        features_scaled = self.scaler.transform(features)

        grade_idx = self.model.predict(features_scaled)[0]
        grade = self.encoder.inverse_transform([grade_idx])[0]
        probabilities = self.model.predict_proba(features_scaled)[0]

        # Price multiplier based on grade
        PRICE_MULTIPLIERS = {'A': 1.20, 'B': 1.00, 'C': 0.80, 'Rejected': 0.0}

        # Build rejection reasons
        reasons = []
        if blemish_pct > 15:
            reasons.append(f"High blemish ({blemish_pct}%)")
        if pest_damage_pct > 10:
            reasons.append(f"Pest damage ({pest_damage_pct}%)")
        if foreign_matter_pct > 8:
            reasons.append(f"Foreign matter ({foreign_matter_pct}%)")
        if color_uniformity < 0.4:
            reasons.append(f"Poor color uniformity ({color_uniformity:.2f})")
        if transit_temp_avg > 38:
            reasons.append(f"Heat exposure ({transit_temp_avg}°C)")

        return {
            'grade': grade,
            'confidence': round(float(probabilities.max()) * 100, 1),
            'grade_probabilities': {
                g: round(float(p) * 100, 1)
                for g, p in zip(self.encoder.classes_, probabilities)
            },
            'price_multiplier': PRICE_MULTIPLIERS.get(grade, 1.0),
            'rejection_reasons': reasons if grade == 'Rejected' else [],
            'quality_notes': f"Grade {grade} — {'Premium export quality' if grade == 'A' else 'Standard mandi quality' if grade == 'B' else 'Below avg, discounted' if grade == 'C' else 'Does not meet FSSAI standards'}",
        }


if __name__ == "__main__":
    clf = CropQualityClassifier()
    clf.train(save=False)

    print("\n=== TEST: Premium Tomato ===")
    result = clf.predict(
        moisture_pct=90, avg_size_cm=6.5, blemish_pct=2,
        color_uniformity=0.92, days_since_harvest=1,
        transit_temp_avg=18, handling_score=0.9
    )
    print(f"   Grade: {result['grade']} (conf: {result['confidence']}%)")
    print(f"   Price multiplier: {result['price_multiplier']}x")

    print("\n=== TEST: Damaged Onion ===")
    result = clf.predict(
        moisture_pct=85, avg_size_cm=5, blemish_pct=25,
        color_uniformity=0.45, days_since_harvest=20,
        pest_damage_pct=12, foreign_matter_pct=6
    )
    print(f"   Grade: {result['grade']} (conf: {result['confidence']}%)")
    print(f"   Reasons: {result['rejection_reasons']}")
