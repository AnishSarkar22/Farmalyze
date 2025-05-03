#!/usr/bin/env python3
"""
This script trains and evaluates a Random Forest model for crop recommendation
using scikit-learn 1.3.2 on the Crop Recommendation dataset.

Requirements:
- scikit-learn==1.3.2
- pandas
- numpy
- matplotlib
- seaborn

Usage:
1. Place the Crop_recommendation.csv file in the Data directory
2. Run this script: python train_crop_recommendation_model.py
3. The trained model will be saved as 'models/RandomForest.pkl'
"""

import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler

# Create directories if they don't exist
os.makedirs('models', exist_ok=True)
os.makedirs('plots', exist_ok=True)

print("Loading dataset...")

# Load the dataset
df = pd.read_csv('../Data/Crop_recommendation.csv')

# Display basic information
print(f"Dataset shape: {df.shape}")
print("\nFirst few rows:")
print(df.head())

print("\nStatistical summary:")
print(df.describe())

print("\nChecking for missing values:")
print(df.isnull().sum())

# Data exploration
print("\nUnique crops in dataset:")
unique_crops = df['label'].unique()
print(f"Number of unique crops: {len(unique_crops)}")
print(unique_crops)

# Count plot for crops
plt.figure(figsize=(12, 6))
ax = sns.countplot(x='label', data=df)
plt.title('Crop Distribution')
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig('plots/crop_distribution.png')
plt.close()

# Feature correlation
plt.figure(figsize=(10, 8))
correlation = df.select_dtypes(include=[np.number]).corr()  # Only include numeric columns
sns.heatmap(correlation, annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Feature Correlation')
plt.tight_layout()
plt.savefig('plots/feature_correlation.png')
plt.close()

# Box plots for numerical features by crop (for top crops)
top_crops = df['label'].value_counts().nlargest(5).index
for feature in ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']:
    plt.figure(figsize=(12, 6))
    sns.boxplot(x='label', y=feature, data=df[df['label'].isin(top_crops)])
    plt.title(f'{feature} Distribution by Top Crops')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f'plots/{feature}_by_crop.png')
    plt.close()

# Prepare data for modeling
print("\nPreparing data for modeling...")
X = df.drop('label', axis=1)
y = df['label']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training set size: {X_train.shape}")
print(f"Testing set size: {X_test.shape}")

# Feature scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model training
print("\nTraining Random Forest model...")

# Base model
rf = RandomForestClassifier(random_state=42)
rf.fit(X_train_scaled, y_train)

# Cross-validation
cv_scores = cross_val_score(rf, X_train_scaled, y_train, cv=5)
print(f"Cross-validation scores: {cv_scores}")
print(f"Mean CV score: {cv_scores.mean():.4f}")

# Hyperparameter tuning
param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [None, 10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

print("\nPerforming hyperparameter tuning...")
print("This may take a few minutes...")

grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=3,
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train_scaled, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best cross-validation score: {grid_search.best_score_:.4f}")

# Train final model with best parameters
best_rf = grid_search.best_estimator_
best_rf.fit(X_train_scaled, y_train)

# Model evaluation
print("\nEvaluating model on test set...")
y_pred = best_rf.predict(X_test_scaled)

print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix
plt.figure(figsize=(12, 10))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=unique_crops, yticklabels=unique_crops)
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig('plots/confusion_matrix.png')
plt.close()

# Feature importance
plt.figure(figsize=(10, 6))
importances = best_rf.feature_importances_
indices = np.argsort(importances)[::-1]
features = X.columns

plt.title('Feature Importance')
plt.bar(range(X.shape[1]), importances[indices], align='center')
plt.xticks(range(X.shape[1]), [features[i] for i in indices], rotation=90)
plt.tight_layout()
plt.savefig('plots/feature_importance.png')
plt.close()

# Save the model
print("\nSaving the model...")
# We're not scaling the features when saving the model since we want to directly use raw input values
final_rf = RandomForestClassifier(**grid_search.best_params_, random_state=42)
final_rf.fit(X_train, y_train)  # Training on unscaled data

# Verify the final model performance
y_pred_final = final_rf.predict(X_test)
print(f"Final model accuracy (unscaled): {accuracy_score(y_test, y_pred_final):.4f}")

# Save the model
with open('../models/RandomForest_test.pkl', 'wb') as f:
    pickle.dump(final_rf, f)

print("\nModel saved to models/RandomForest.pkl")
print("\nTraining complete!")