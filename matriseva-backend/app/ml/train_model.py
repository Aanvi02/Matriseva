"""
Train the Maternal Health Risk model.
Run this script whenever you have new data:
    python app/ml/train_model.py
"""

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import pickle
import os

# ── Load Data ────────────────────────────────────────────────
DATA_PATH  = os.path.join(os.path.dirname(__file__), "Maternal_Health_Risk_Data_Set.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
print(f"Loaded {len(df)} records")
print("Risk distribution:")
print(df["RiskLevel"].value_counts())

# ── Prepare Data ─────────────────────────────────────────────
le = LabelEncoder()
df["risk_encoded"] = le.fit_transform(df["RiskLevel"])

X = df.drop(["RiskLevel", "risk_encoded"], axis=1)
y = df["risk_encoded"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train Model ──────────────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    random_state=42
)
model.fit(X_train, y_train)

# ── Evaluate ─────────────────────────────────────────────────
scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
print(f"\nCross-validation accuracy: {scores.mean()*100:.1f}% (+/- {scores.std()*100:.1f}%)")

y_pred = model.predict(X_test)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

print("Feature Importance:")
for feat, imp in sorted(zip(X.columns, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat}: {imp*100:.1f}%")

# ── Save Model ───────────────────────────────────────────────
with open(MODEL_PATH, "wb") as f:
    pickle.dump({
        "model":    model,
        "encoder":  le,
        "features": list(X.columns),
        "classes":  list(le.classes_),
    }, f)

print(f"\nModel saved to {MODEL_PATH}")
