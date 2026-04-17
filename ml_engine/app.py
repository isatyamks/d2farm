from flask import Flask, request, jsonify
from flask_cors import CORS
from pricing_model import d2farm_ml_hub

app = Flask(__name__)
CORS(app)

@app.route('/api/ml/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ACTIVE", "engine": "D2Farm DeepTech ML Hub"})

@app.route('/api/ml/forecast-price', methods=['GET'])
def api_forecast():
    # Example Params: ?crop=Tomato&current_price=22&weather_severity=3
    crop = request.args.get('crop', 'Tomato')
    current_price = float(request.args.get('current_price', 20.0))
    weather_severity = int(request.args.get('weather_severity', 1))
    
    result = d2farm_ml_hub.forecast_price(crop, current_price, weather_severity)
    return jsonify({"success": True, "data": result})

@app.route('/api/ml/predict-demand', methods=['GET'])
def api_demand():
    # Example Params: ?crop=Onion&lat=20.0&lng=73.7
    crop = request.args.get('crop', 'Onion')
    result = d2farm_ml_hub.predict_demand(crop, 20.0, 73.7)
    return jsonify({"success": True, "data": result})

@app.route('/api/ml/predict-spoilage', methods=['GET'])
def api_spoilage():
    # Example Params: ?crop=Tomato&travel_hours=12&temp=32&humidity=80
    crop = request.args.get('crop', 'Tomato')
    travel_hours = float(request.args.get('travel_hours', 12.0))
    temp = float(request.args.get('temp', 32.0))
    humidity = float(request.args.get('humidity', 80.0))
    
    result = d2farm_ml_hub.predict_spoilage(crop, travel_hours, temp, humidity)
    return jsonify({"success": True, "data": result})

@app.route('/api/ml/optimize-route', methods=['GET'])
def api_route():
    result = d2farm_ml_hub.optimize_route(20.0, 73.7, 19.0, 72.8)
    return jsonify({"success": True, "data": result})

if __name__ == '__main__':
    print("🧠 D2Farm DeepTech ML Flask Engine Booting on Port 5000...")
    app.run(port=5000, debug=True)
