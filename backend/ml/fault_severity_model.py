# fault_severity_model.py
# Predicts fault severity (Low/Medium/High/Critical) using a Random Forest classifier.
# Trained on fault and location data from the GetLink AR maintenance system database.
#
# Run order: node backend/db/init.js → node backend/db/seed.js → python backend/ml/fault_severity_model.py
# Usage: python backend/ml/fault_severity_model.py

import pandas as pd
import numpy as np
import sqlite3
import os

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Build the path to the database relative to this file's location
DB_PATH = os.path.join(os.path.dirname(__file__), '../db/ar_transport.db')
conn = sqlite3.connect(DB_PATH)

# Query fault data joined with location context

query = """
    SELECT 
        f.fault_type,
        f.asset_class,
        f.severity,
        l.tunnel_section,
        l.zone_type
    FROM faults f
    JOIN locations l ON f.location_id = l.id
"""

# Load the query result directly into a pandas DataFrame
df = pd.read_sql_query(query, conn)
conn.close()

# Exit early if no data found
if df.empty:
    print("No fault data found — run seed.js first")
    exit()

print(f"Loaded {len(df)} fault records from database")
print(f"\nSeverity distribution:\n{df['severity'].value_counts()}\n")

# Encode categorical features
encoders = {}
feature_cols = ['fault_type', 'asset_class', 'tunnel_section', 'zone_type']

for col in feature_cols:
    le = LabelEncoder()
    df[col + '_encoded'] = le.fit_transform(df[col])
    encoders[col] = le

# Encode the target column (severity) separately
target_encoder = LabelEncoder()
df['severity_encoded'] = target_encoder.fit_transform(df['severity'])

# Split into features (X) and target (y)
X = df[[col + '_encoded' for col in feature_cols]]
y = df['severity_encoded']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42 # 80:20 train:test split
)

#Train Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
# Predict severity for the held-back test set
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"Model accuracy: {accuracy * 100:.1f}%\n")

# Classification report - precision, recall and F1 per severity class
print("Classification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=target_encoder.classes_,
    zero_division=0
))

# Feature importance
print("Feature Importance:")
for feature, importance in zip(feature_cols, model.feature_importances_):
    print(f"  {feature:<20} {importance:.4f}")

# Example prediction
# Demonstrates the model making a prediction on a new unseen fault
print("\nExample Prediction:")
sample = {
    'fault_type': 'Crack',
    'asset_class': 'Civil',
    'tunnel_section': 'Subsea North',
    'zone_type': 'Running Tunnel'
}

# Encode the sample using the same encoders fitted on training data
sample_encoded = []
for col in feature_cols:
    le = encoders[col]
    try:
        val = le.transform([sample[col]])[0]
    except ValueError:
        # If an unseen value is passed, default to 0
        val = 0
    sample_encoded.append(val)

sample_df = pd.DataFrame([sample_encoded], columns=[col + '_encoded' for col in feature_cols])
prediction = model.predict(sample_df)
probability = model.predict_proba(sample_df)

predicted_severity = target_encoder.inverse_transform(prediction)[0]
confidence = np.max(probability) * 100

print(f"  Input:      {sample}")
print(f"  Predicted severity: {predicted_severity} ({confidence:.1f}% confidence)")