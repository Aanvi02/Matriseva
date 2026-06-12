import os
import pickle
import numpy as np
from fastapi import HTTPException

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "risk_model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        _loaded = pickle.load(f)
    if isinstance(_loaded, dict):
        _model = _loaded.get("model") or _loaded.get("classifier") or list(_loaded.values())[0]
    else:
        _model = _loaded
    print(f"✅ ML model loaded: {type(_model)}")
except Exception as e:
    print(f"❌ Model load failed: {e}")
    _model = None

async def predict_risk(data: dict) -> dict:
    if _model is None:
        raise HTTPException(status_code=500, detail="ML model not loaded")

    try:
        # Exact 6 features jaise model train hua tha
        features = np.array([[
            float(data.get("age", 25)),           # Age
            float(data.get("bp_sys", 120)),        # SystolicBP
            float(data.get("bp_dia", 80)),         # DiastolicBP
            float(data.get("sugar", 90)),          # BS (Blood Sugar)
            float(data.get("body_temp", 98)),      # BodyTemp
            float(data.get("heart_rate", 75)),     # HeartRate
        ]])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Invalid vitals data")

    pred  = _model.predict(features)[0]
    proba = _model.predict_proba(features)[0]
    score = int(round(max(proba) * 100))
    level = {0:"LOW", 1:"MEDIUM", 2:"HIGH"}.get(int(pred), "MEDIUM")

    # Flags rule-based (Hb model mein nahi hai toh manually check)
    flags = []
    if float(data.get("bp_sys", 0)) >= 140:   flags.append("High BP")
    if float(data.get("hb", 12)) < 7:          flags.append("Severe Anemia")
    elif float(data.get("hb", 12)) < 10:       flags.append("Low Hb")
    if float(data.get("sugar", 0)) > 140:      flags.append("High Blood Sugar")
    if float(data.get("body_temp", 98)) > 100: flags.append("Fever")

    return {"level": level, "score": score, "flags": flags}