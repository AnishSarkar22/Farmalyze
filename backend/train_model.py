import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Load the crop recommendation dataset
df = pd.read_csv('../backend/models/RandomForest.pkl')

# Prepare features and target 
features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
target = 'label'

X = df[features]
y = df[target]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest model with optimized parameters
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

# Save the model
model_path = 'models/RandomForest_test.pkl'
pickle.dump(rf_model, open(model_path, 'wb'))

# Print model evaluation metrics
train_accuracy = rf_model.score(X_train, y_train)
test_accuracy = rf_model.score(X_test, y_test)

print(f"Training Accuracy: {train_accuracy:.4f}")
print(f"Testing Accuracy: {test_accuracy:.4f}")

# Verify model works with sample input
sample_input = np.array([[104, 18, 30, 23.603016, 60.3, 6.7, 140.91]])
prediction = rf_model.predict(sample_input)
print(f"\nSample prediction test:")
print(f"Input: N=104, P=18, K=30, temp=23.6, humidity=60.3, ph=6.7, rainfall=140.91")
print(f"Predicted crop: {prediction[0]}")