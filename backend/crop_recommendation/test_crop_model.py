#!/usr/bin/env python3
"""
This script demonstrates how to use the trained Random Forest model for crop recommendation.
It loads the saved model and makes predictions based on input soil and weather parameters.

Usage:
1. Make sure the trained model exists at 'models/RandomForest.pkl'
2. Run this script: python test_crop_model.py
"""

import pickle
import numpy as np
import pandas as pd

def load_model(model_path='../models/RandomForest_test.pkl'):
    """Load the trained model from the specified path."""
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    return model

def predict_crop(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, model=None):
    """Predict crop based on soil and weather parameters."""
    if model is None:
        model = load_model()
    
    # Create input DataFrame for prediction
    input_data = pd.DataFrame({
        'N': [nitrogen], 
        'P': [phosphorus], 
        'K': [potassium], 
        'temperature': [temperature], 
        'humidity': [humidity], 
        'ph': [ph], 
        'rainfall': [rainfall]
    })
    
    
    # Make prediction
    prediction = model.predict(input_data)
    probabilities = model.predict_proba(input_data)
    
    # Get top 3 predictions with probabilities
    proba_df = pd.DataFrame({
        'crop': model.classes_,
        'probability': probabilities[0]
    }).sort_values(by='probability', ascending=False).head(3)
    
    return prediction[0], proba_df

def main():
    """Main function to demonstrate model usage."""
    print("Crop Recommendation System\n")
    
    # Load the model
    print("Loading model...")
    model = load_model()
    print("Model loaded successfully!")
    
    # Example soil and weather parameters
    print("\nExample 1: Rice growing conditions")
    nitrogen = 80
    phosphorus = 40
    potassium = 40
    temperature = 24.0
    humidity = 80.0
    ph = 7.0
    rainfall = 200.0
    
    crop, top_crops = predict_crop(
        nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, model
    )
    
    print(f"Input parameters:")
    print(f"Nitrogen: {nitrogen} kg/ha")
    print(f"Phosphorus: {phosphorus} kg/ha")
    print(f"Potassium: {potassium} kg/ha")
    print(f"Temperature: {temperature} °C")
    print(f"Humidity: {humidity} %")
    print(f"pH: {ph}")
    print(f"Rainfall: {rainfall} mm")
    
    print(f"\nPredicted crop: {crop}")
    print("\nTop 3 recommended crops:")
    print(top_crops)
    
    # Example 2: Different conditions
    print("\n\nExample 2: Different growing conditions")
    nitrogen = 40
    phosphorus = 120
    potassium = 100
    temperature = 18.0
    humidity = 60.0
    ph = 6.5
    rainfall = 100.0
    
    crop, top_crops = predict_crop(
        nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, model
    )
    
    print(f"Input parameters:")
    print(f"Nitrogen: {nitrogen} kg/ha")
    print(f"Phosphorus: {phosphorus} kg/ha")
    print(f"Potassium: {potassium} kg/ha")
    print(f"Temperature: {temperature} °C")
    print(f"Humidity: {humidity} %")
    print(f"pH: {ph}")
    print(f"Rainfall: {rainfall} mm")
    
    print(f"\nPredicted crop: {crop}")
    print("\nTop 3 recommended crops:")
    print(top_crops)

if __name__ == "__main__":
    main()