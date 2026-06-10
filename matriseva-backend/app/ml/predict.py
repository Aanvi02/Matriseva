import pickle
import os

# Load model once when module is imported
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

with open(MODEL_PATH, "rb") as f:
    saved = pickle.load(f)

model    = saved["model"]
encoder  = saved["encoder"]
features = saved["features"]
classes  = saved["classes"]

# Map labels to your app's format
RISK_MAP = {
    "high risk": "HIGH",
    "mid risk":  "MEDIUM",
    "low risk":  "LOW",
}


def predict_risk(data: dict) -> dict:
    # Convert blood sugar from mg/dL to mmol/L (dataset uses mmol/L)
    sugar_mgdl = float(data.get("sugar", 90))
    sugar_mmol = round(sugar_mgdl / 18.0, 1)

    row = [
        float(data.get("age",        25)),
        float(data.get("bp_sys",    120)),
        float(data.get("bp_dia",     80)),
        sugar_mmol,
        float(data.get("body_temp",  98)),
        float(data.get("heart_rate", 75)),
    ]

    # Predict
    prediction  = model.predict([row])[0]
    probability = model.predict_proba([row])[0]
    raw_label   = encoder.inverse_transform([prediction])[0]
    risk_level  = RISK_MAP.get(raw_label, "MEDIUM")
    score       = int(float(max(probability)) * 100)

    # Generate flags based on actual values
    flags   = []
    age     = float(data.get("age",    25))
    bp_sys  = float(data.get("bp_sys",  0))
    bp_dia  = float(data.get("bp_dia",  0))
    hb      = float(data.get("hb",      0))
    sugar   = float(data.get("sugar",   0))

    if bp_sys >= 160 or bp_dia >= 110:
        flags.append("Severe Hypertension")
    elif bp_sys >= 140 or bp_dia >= 90:
        flags.append("High Blood Pressure")

    if hb > 0:
        if hb < 7:    flags.append("Severe Anemia")
        elif hb < 9:  flags.append("Moderate Anemia")

    if age < 18:      flags.append("Teenage Pregnancy")
    elif age > 35:    flags.append("Advanced Maternal Age")

    if sugar > 140:   flags.append("High Blood Sugar")

    if data.get("hiv") == "Positive":
        flags.append("HIV Positive")

    if data.get("pregnancyType") in ["Twin", "Triplet"]:
        flags.append("Multiple Pregnancy")

    return {
        "level": risk_level,
        "score": score,
        "flags": flags,
    }