from flask import Flask, request, jsonify
from pricing_model import predict_realtime_price
import os

app = Flask(__name__)

@app.route('/api/ml/predict-price', methods=['POST'])
def predict_price():
    try:
        data = request.get_json()
        
        # Extract features (use realistic defaults if missing)
        supply = float(data.get('supply', 1000.0))
        demand = float(data.get('demand', 1500.0))
        weather = int(data.get('weather', 0))
        cost = float(data.get('cultivation_cost', 15.0))
        policy = float(data.get('gov_policy', 1.0))
        
        # Predict
        predicted_price = predict_realtime_price(supply, demand, weather, cost, policy)
        
        return jsonify({
            "success": True,
            "predicted_price_per_kg": round(predicted_price, 2),
            "factors": {
                "supply": supply,
                "demand": demand,
                "ratio": round(demand / (supply + 1), 2)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ML Engine Active"})

if __name__ == '__main__':
    # Run the ML API on port 5000
    print("🚀 Mounting AI Pricing Engine on Port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
