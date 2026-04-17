import sys
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

MODEL_FILE = os.path.join(os.path.dirname(__file__), 'price_model.pkl')
SCALER_FILE = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

def generate_synthetic_data(samples=10000):
    """
    Generates synthetic dataset for crop pricing based on complex real-world metrics.
    """
    np.random.seed(42)
    
    # Base costs and features
    supply = np.random.uniform(500, 5000, samples) # Supply in kg
    demand = np.random.uniform(500, 6000, samples) # Demand in kg
    cultivation_cost = np.random.uniform(8, 25, samples) # Base cultivation cost
    
    # 0 = Normal, 1 = Drought (reduces yield, spikes price), 2 = Flood
    weather_condition = np.random.choice([0, 1, 2], samples, p=[0.7, 0.2, 0.1])
    
    # 1.0 = Neutral, >1 = Gov Subsidy (lowers price), <1 = Export Ban (lowers price artificially inside country) / Over-taxation (raises price)
    gov_policy = np.random.uniform(0.8, 1.2, samples) 
    
    # Math Engine: Price = Base Cost + (Demand/Supply Impact) * Weather / Policy
    ratio = demand / (supply + 1) 
    
    weather_multiplier = np.ones(samples)
    weather_multiplier[weather_condition == 1] = 1.45 # Drought spikes price 45%
    weather_multiplier[weather_condition == 2] = 1.25 # Flood spikes price 25%
    
    # Pricing Formula
    price = (cultivation_cost * 1.1) + ((ratio * 6.5) * weather_multiplier) / gov_policy
    price += np.random.normal(0, 1.2, samples) # Add organic market noise (volatility)
    price = np.clip(price, cultivation_cost * 1.05, 150) # Floor price is cost + 5%

    df = pd.DataFrame({
        'supply': supply,
        'demand': demand,
        'weather': weather_condition,
        'cultivation_cost': cultivation_cost,
        'gov_policy': gov_policy,
        'target_price': price
    })
    return df

def train_and_save_model():
    # Only generated if model doesn't exist yet
    df = generate_synthetic_data()
    
    X = df[['supply', 'demand', 'weather', 'cultivation_cost', 'gov_policy']]
    y = df['target_price']
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train robust Random Forest to handle the non-linear relationship between weather and demand
    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    model.fit(X_scaled, y)
    
    joblib.dump(model, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)

def predict_realtime_price(supply, demand, weather=0, cult_cost=15.0, gov_policy=1.0):
    # Auto-train on first boot if missing
    if not os.path.exists(MODEL_FILE) or not os.path.exists(SCALER_FILE):
        train_and_save_model()
        
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    
    # Shape input features for scikit-learn
    features = np.array([[supply, demand, weather, cult_cost, gov_policy]])
    features_scaled = scaler.transform(features)
    
    predicted_price = model.predict(features_scaled)[0]
    return predicted_price

if __name__ == "__main__":
    # If arguments are passed, this acts as a headless microservice for Node.js
    if len(sys.argv) > 2:
        try:
            supply_val = float(sys.argv[1])
            demand_val = float(sys.argv[2])
            weather_val = int(sys.argv[3]) if len(sys.argv) > 3 else 0
            cost_val = float(sys.argv[4]) if len(sys.argv) > 4 else 15.0
            policy_val = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
            
            price = predict_realtime_price(supply_val, demand_val, weather_val, cost_val, policy_val)
            
            # Print strict JSON so Node.js child_process can parse it easily
            print(json.dumps({
                "success": True,
                "predicted_price_per_kg": round(price, 2),
                "supply_demand_ratio": round(demand_val / (supply_val + 1), 2)
            }))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
    else:
        # Default run: Force training and output an example
        train_and_save_model()
        print("✅ D2Farm ML Pricing Engine Built Successfully.")
        print("Current Models Saved: price_model.pkl, scaler.pkl\n")
        
        # Test Sample
        test_price = predict_realtime_price(supply=1000, demand=4500, weather=1, cult_cost=18, gov_policy=0.9)
        print("=== SIMULATED REAL-WORLD SCENARIO ===")
        print("Conditions: High Demand (4500kg), Low Supply (1000kg), Drought Active, Heavy Taxation")
        print(f"📈 Predicted Output Price: ₹{test_price:.2f}/kg")
