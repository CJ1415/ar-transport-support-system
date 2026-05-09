# fault_severity_model.py
# Predicts fault severity (Low/Medium/High/Critical) using a Random Forest classifier.
# Trained on historical fault data, saves predictions for active faults to the database.
#
# Run order: node backend/db/init.js → node backend/db/seed.js → python backend/ml/fault_severity_model.py

import pandas as pd
import numpy as np
import sqlite3
import os

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Build path to database relative to this file
DB_PATH = os.path.join(os.path.dirname(__file__), '../db/ar_transport.db')
conn = sqlite3.connect(DB_PATH)

# Load historical resolved/closed faults for training
query = """
    SELECT 
        f.fault_type,
        f.asset_class,
        f.severity,
        l.tunnel_section,
        l.zone_type
    FROM faults f
    JOIN locations l ON f.location_id = l.id
    WHERE f.status IN ('Resolved', 'Closed')
"""

df = pd.read_sql_query(query, conn)

if df.empty:
    print("No historical fault data found — run seed.js first")
    conn.close()
    exit()

print(f"Loaded {len(df)} historical fault records for training")
print(f"\nSeverity distribution:\n{df['severity'].value_counts()}\n")

# Encode categorical features to numbers
encoders = {}
feature_cols = ['fault_type', 'asset_class', 'tunnel_section', 'zone_type']

for col in feature_cols:
    le = LabelEncoder()
    df[col + '_encoded'] = le.fit_transform(df[col])
    encoders[col] = le

# Encode target column separately
target_encoder = LabelEncoder()
df['severity_encoded'] = target_encoder.fit_transform(df['severity'])

# Split into features and target
X = df[[col + '_encoded' for col in feature_cols]]
y = df['severity_encoded']

# 80/20 train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"Model accuracy: {accuracy * 100:.1f}%\n")
print("Classification Report:")
print(classification_report(
    y_test, y_pred,
    labels=np.unique(y_test),
    target_names=target_encoder.inverse_transform(np.unique(y_test)),
    zero_division=0
))

# Feature importance
print("Feature Importance:")
for feature, importance in zip(feature_cols, model.feature_importances_):
    print(f"  {feature:<20} {importance:.4f}")

# Load active faults to predict on
active_query = """
    SELECT 
        f.id,
        f.fault_type,
        f.asset_class,
        l.tunnel_section,
        l.zone_type
    FROM faults f
    JOIN locations l ON f.location_id = l.id
    WHERE f.status IN ('Open', 'In progress')
    AND f.deleted_at IS NULL
"""

active_faults = pd.read_sql_query(active_query, conn)

if active_faults.empty:
    print("\nNo active faults to predict on")
    conn.close()
    exit()

print(f"\nPredicting severity for {len(active_faults)} active faults...")

# Clear old predictions and save new ones
conn.execute("DELETE FROM predictions")

cursor = conn.cursor()
for _, fault in active_faults.iterrows():
    sample_encoded = []
    for col in feature_cols:
        le = encoders[col]
        try:
            val = le.transform([fault[col]])[0]
        except ValueError:
            val = 0
        sample_encoded.append(val)

    sample_df = pd.DataFrame([sample_encoded], columns=[col + '_encoded' for col in feature_cols])
    prediction = model.predict(sample_df)
    probability = model.predict_proba(sample_df)

    predicted_severity = target_encoder.inverse_transform(prediction)[0]
    confidence = float(np.max(probability) * 100)

    cursor.execute(
        "INSERT INTO predictions (fault_id, predicted_severity, confidence) VALUES (?, ?, ?)",
        (int(fault['id']), predicted_severity, confidence)
    )
    print(f"  Fault {int(fault['id'])}: {fault['fault_type']} → {predicted_severity} ({confidence:.1f}% confidence)")

conn.commit()
conn.close()
print(f"\nPredictions saved to database")