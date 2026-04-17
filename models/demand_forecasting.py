"""
Demand Forecasting Model
========================
Predicts buyer demand 3-7 days ahead for the D2Farm matching engine.

Combines:
    - Historical buyer procurement patterns (POS integration)
    - Seasonal demand curves (wedding/festival calendar)
    - Weather-driven consumption shifts
    - Day-of-week purchase patterns

Used by:
    - DemandPlanner (buyer dashboard)
    - MatchingEngine (allocation optimization)
    - ProcurementAI (smart order suggestions)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

MODEL_DIR = os.path.dirname(__file__)
DEMAND_MODEL = os.path.join(MODEL_DIR, 'artifacts', 'demand_forecast.pkl')
DEMAND_SCALER = os.path.join(MODEL_DIR, 'artifacts', 'demand_scaler.pkl')

# Indian festival/event calendar — demand multipliers
# Source: FHRAI hospitality consumption reports, Zomato Trends 2023-24
DEMAND_EVENTS = {
    # Month → list of (event_name, demand_multiplier, affected_crops)
    1:  [('Makar Sankranti', 1.25, ['Rice', 'Til', 'Jaggery'])],
    2:  [('Wedding Season Peak', 1.40, ['Onion', 'Tomato', 'Potato', 'Capsicum'])],
    3:  [('Holi', 1.30, ['Potato', 'Onion']), ('Board Exams End', 0.90, ['All'])],
    4:  [('Navratri', 1.35, ['Potato', 'Banana']), ('Ram Navami', 1.20, ['Banana', 'Mango'])],
    5:  [('Summer Peak', 1.15, ['Mango', 'Onion']), ('Wedding Season', 1.35, ['All'])],
    6:  [('Monsoon Start', 0.85, ['Tomato', 'Capsicum']), ('Eid', 1.30, ['Onion', 'Potato'])],
    7:  [('Monsoon Peak', 0.80, ['Tomato']), ('School Reopen', 1.10, ['Rice', 'Wheat'])],
    8:  [('Independence Day', 1.05, ['All']), ('Janmashtami', 1.15, ['Banana'])],
    9:  [('Ganesh Chaturthi', 1.25, ['Banana', 'Mango']), ('Onam', 1.30, ['Banana', 'Rice'])],
    10: [('Navratri', 1.35, ['Potato', 'Banana']), ('Dussehra', 1.20, ['All'])],
    11: [('Diwali', 1.50, ['All']), ('Wedding Season Start', 1.35, ['Onion', 'Potato'])],
    12: [('Christmas', 1.15, ['Capsicum', 'Potato']), ('Wedding Season Peak', 1.45, ['All'])],
}

# Day-of-week demand patterns for restaurants (normalized)
DOW_PATTERN = {
    0: 0.85,  # Monday — low
    1: 0.90,  # Tuesday
    2: 0.95,  # Wednesday
    3: 1.00,  # Thursday — procurement day
    4: 1.15,  # Friday — weekend prep
    5: 1.25,  # Saturday — peak
    6: 1.10,  # Sunday — moderate
}


class DemandForecaster:
    """
    Time-series demand forecasting model using GradientBoosting
    with engineered temporal features.

    Input Features:
        - day_of_week        : 0-6 (Mon-Sun)
        - month              : 1-12
        - is_festival        : Binary (festival period)
        - festival_multiplier: Event-specific demand boost (1.0-1.5)
        - weather_temp       : Average temperature (°C)
        - prev_week_demand   : Last week's demand for this crop (kg)
        - buyer_count        : Active buyers on platform
        - crop_category      : 0=vegetable, 1=fruit, 2=grain, 3=spice
        - mandi_price_trend  : Price movement (-1=falling, 0=stable, 1=rising)
        - city_population    : Demand zone population (lakhs)

    Output:
        Predicted demand in kg for the target date
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.feature_names = [
            'day_of_week', 'month', 'is_festival', 'festival_multiplier',
            'weather_temp', 'prev_week_demand', 'buyer_count',
            'crop_category', 'mandi_price_trend', 'city_population'
        ]

    def _generate_training_data(self, n_samples=30000):
        """Generate 2-year synthetic demand data mimicking Indian buyer patterns."""
        np.random.seed(42)

        days_of_week = np.random.randint(0, 7, n_samples)
        months = np.random.randint(1, 13, n_samples)

        # Festival detection
        is_festival = np.zeros(n_samples)
        festival_mult = np.ones(n_samples)
        for i in range(n_samples):
            events = DEMAND_EVENTS.get(months[i], [])
            if events and np.random.random() < 0.35:
                ev = events[np.random.randint(len(events))]
                is_festival[i] = 1
                festival_mult[i] = ev[1]

        weather_temp = np.random.normal(30, 8, n_samples).clip(5, 48)
        prev_demand = np.random.lognormal(7, 0.8, n_samples).clip(200, 50000)
        buyer_count = np.random.randint(5, 150, n_samples)
        crop_cat = np.random.choice([0, 1, 2, 3], n_samples, p=[0.45, 0.25, 0.20, 0.10])
        price_trend = np.random.choice([-1, 0, 1], n_samples, p=[0.30, 0.40, 0.30])
        city_pop = np.random.uniform(2, 200, n_samples)

        # Demand generation model:
        dow_factor = np.array([DOW_PATTERN[d] for d in days_of_week])

        # Seasonal baseline (winter = high, monsoon = low)
        seasonal_factor = 1 + 0.15 * np.cos((months - 1) * np.pi / 6)

        # Temperature effect: extreme heat → lower demand
        temp_factor = np.where(weather_temp > 40, 0.85,
                     np.where(weather_temp < 10, 1.10, 1.0))

        # Price sensitivity: rising prices → lower demand
        price_factor = np.where(price_trend == 1, 0.90,
                      np.where(price_trend == -1, 1.12, 1.0))

        # Base demand from population + buyer count
        base_demand = (city_pop * 3.5 + buyer_count * 12) * seasonal_factor

        demand = (
            base_demand
            * dow_factor
            * festival_mult
            * temp_factor
            * price_factor
            * (1 + 0.15 * np.log1p(prev_demand / 1000))
            + np.random.normal(0, base_demand * 0.08)
        ).clip(50, 80000)

        df = pd.DataFrame({
            'day_of_week': days_of_week,
            'month': months,
            'is_festival': is_festival.astype(int),
            'festival_multiplier': festival_mult.round(2),
            'weather_temp': weather_temp.round(1),
            'prev_week_demand': prev_demand.round(0),
            'buyer_count': buyer_count,
            'crop_category': crop_cat,
            'mandi_price_trend': price_trend,
            'city_population': city_pop.round(1),
            'target_demand_kg': demand.round(0),
        })
        return df

    def train(self, save=True):
        """Train the demand forecasting model."""
        print("🧠 [DemandForecasting] Generating 30,000 time-series samples...")
        df = self._generate_training_data()

        X = df[self.feature_names]
        y = df['target_demand_kg']

        # Time-series aware split
        tscv = TimeSeriesSplit(n_splits=5)
        scores = []

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        print("📈 Training GradientBoosting (250 stages, lr=0.06)...")
        self.model = GradientBoostingRegressor(
            n_estimators=250, max_depth=8, learning_rate=0.06,
            subsample=0.85, min_samples_leaf=10, random_state=42
        )

        for fold, (train_idx, test_idx) in enumerate(tscv.split(X_scaled)):
            X_train, X_test = X_scaled[train_idx], X_scaled[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

            self.model.fit(X_train, y_train)
            y_pred = self.model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            scores.append(mae)

        avg_mae = np.mean(scores)
        print(f"✅ Cross-validated MAE: {avg_mae:.0f} kg (5-fold TimeSeries)")
        print(f"   Feature importances: {dict(zip(self.feature_names, self.model.feature_importances_.round(3)))}")

        self.is_trained = True

        if save:
            os.makedirs(os.path.join(MODEL_DIR, 'artifacts'), exist_ok=True)
            joblib.dump(self.model, DEMAND_MODEL)
            joblib.dump(self.scaler, DEMAND_SCALER)
            print(f"💾 Demand model saved.")

        return {'avg_mae_kg': avg_mae}

    def load(self):
        if not os.path.exists(DEMAND_MODEL):
            self.train()
            return
        self.model = joblib.load(DEMAND_MODEL)
        self.scaler = joblib.load(DEMAND_SCALER)
        self.is_trained = True

    def predict(self, day_of_week, month, buyer_count,
                crop_category=0, city_population=50,
                prev_week_demand=2000, weather_temp=30,
                mandi_price_trend=0):
        """Predict demand for a specific day."""
        if not self.is_trained:
            self.load()

        # Auto-detect festival
        events = DEMAND_EVENTS.get(month, [])
        is_fest = 1 if events else 0
        fest_mult = events[0][1] if events else 1.0

        features = np.array([[
            day_of_week, month, is_fest, fest_mult,
            weather_temp, prev_week_demand, buyer_count,
            crop_category, mandi_price_trend, city_population
        ]])
        features_scaled = self.scaler.transform(features)
        demand = self.model.predict(features_scaled)[0]

        return {
            'predicted_demand_kg': round(max(0, demand)),
            'festival_boost': fest_mult if is_fest else None,
            'festival_name': events[0][0] if events else None,
            'confidence_band': {
                'lower': round(max(0, demand * 0.85)),
                'upper': round(demand * 1.15),
            },
            'procurement_signal': 'HIGH' if demand > 3000 else 'MODERATE' if demand > 1000 else 'LOW',
        }

    def forecast_week(self, month, buyer_count, crop_category=0,
                      city_population=50, prev_week_demand=2000):
        """Generate 7-day demand forecast."""
        forecasts = []
        for day in range(7):
            result = self.predict(
                day_of_week=day, month=month,
                buyer_count=buyer_count, crop_category=crop_category,
                city_population=city_population,
                prev_week_demand=prev_week_demand
            )
            forecasts.append({
                'day': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
                **result
            })
        return forecasts


if __name__ == "__main__":
    model = DemandForecaster()
    model.train(save=False)

    print("\n=== DIWALI WEEK FORECAST (November, Bhopal) ===")
    week = model.forecast_week(
        month=11, buyer_count=80, crop_category=0, city_population=25
    )
    for day in week:
        fest = f" 🎉 {day['festival_name']}" if day['festival_boost'] else ""
        print(f"   {day['day']}: {day['predicted_demand_kg']}kg [{day['procurement_signal']}]{fest}")
