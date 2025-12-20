# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

# --- MRPL REFINERY SIMULATION ENGINE ---
# We simulate a "Sour Water Stripper" + "Bio-Reactor" setup typical in refineries.

class DigitalTwin:
    def __init__(self):
        # Baseline parameters (Normal Operation at MRPL)
        self.state = {
            "cod": 350,       # mg/L (Chemical Oxygen Demand)
            "phenol": 0.8,    # mg/L (Critical for refineries)
            "oil_grease": 15, # mg/L
            "sulfide": 2.5,   # mg/L
            "ph": 7.5,
            "flow": 120,      # m3/hr
            "efficiency": 92  # %
        }
        self.scenarios = "NORMAL"

    def update(self):
        # 1. Physics: If Flow spikes, Efficiency drops
        if self.state["flow"] > 140:
            self.state["efficiency"] -= 0.5
        else:
            self.state["efficiency"] += 0.1
        
        self.state["efficiency"] = max(80, min(98, self.state["efficiency"]))

        # 2. Add realistic noise (Sensors are never perfect)
        self.state["cod"] += np.random.normal(0, 5)
        self.state["phenol"] += np.random.normal(0, 0.05)
        self.state["oil_grease"] += np.random.normal(0, 1)

        return self.state

    def trigger_shock_load(self, type):
        """Simulate specific Refinery Failures"""
        if type == "DESALTER_FAIL":
            self.state["oil_grease"] = 150 # Massive Oil Spike
            self.state["cod"] = 900
            self.scenarios = "CRITICAL: DESALTER UPSET"
        elif type == "SOUR_WATER_FAIL":
            self.state["phenol"] = 15.0 # Toxic Shock
            self.state["sulfide"] = 25.0
            self.scenarios = "CRITICAL: SOUR WATER STRIPPER FAILURE"
    
    def normalize(self):
        """Operator fixes the issue"""
        self.state["phenol"] = 0.8
        self.state["oil_grease"] = 15
        self.state["cod"] = 350
        self.scenarios = "NORMAL"

twin = DigitalTwin()

# --- API ENDPOINTS FOR FRONTEND ---

@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    """Simulates reading from SCADA/PLC (Modbus TCP)"""
    data = twin.update()
    
    # Calculate AI-Recommended Dosing based on "Phenol" load
    # Refineries use specific bacteria for Phenol; they need precise nutrients.
    recommended_dosing = (data["phenol"] * 10) + (data["cod"] * 0.05)
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "sensors": data,
        "ai_prediction": {
            "recommended_dosing_ml_min": round(recommended_dosing, 2),
            "predicted_effluent_cod": round(data["cod"] * (1 - (data["efficiency"]/100)), 2),
            "compliance_status": "COMPLIANT" if data["phenol"] < 1.0 else "NON-COMPLIANT"
        },
        "system_status": twin.scenarios
    })

@app.route('/api/simulation/trigger', methods=['POST'])
def trigger_scenario():
    """For Demo: Let you force a failure to show how AI reacts"""
    scenario = request.json.get('scenario')
    if scenario == "RESET":
        twin.normalize()
    else:
        twin.trigger_shock_load(scenario)
    return jsonify({"status": "Scenario Activated", "current_state": twin.scenarios})

if __name__ == '__main__':
    print("HydraMind Digital Twin (MRPL Edition) Running on Port 5000...")
    app.run(port=5000, debug=True)