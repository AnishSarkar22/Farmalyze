# RUN THIS instead of test_crop_model.py

"""
Enhanced Crop Recommendation System

This script provides a robust implementation of the crop recommendation system that delivers
three sorted recommendations with confidence scores. It includes improved visualization and 
detailed explanation of each recommendation.

Usage:
1. Make sure the trained model exists at 'models/EnhancedRandomForest.pkl'
2. Run this script: python enhanced_crop_recommender.py
"""

import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Create directories if they don't exist
os.makedirs('recommendations', exist_ok=True)

class CropRecommender:
    """
    A class to handle crop recommendations based on soil and weather parameter5s.
    Provides multiple recommendations sorted by confidence.
    """
    
    def __init__(self, model_path='../models/EnhancedRandomForest.pkl'):
        """Initialize the recommender by loading the trained model."""
        self.model = self._load_model(model_path)
        
        # Optional: Load feature importance information if available
        try:
            self.feature_importance = pd.read_csv('models/feature_importance.csv')
        except FileNotFoundError:
            self.feature_importance = None
            
        # Define optimal ranges for each crop (simplified example - would be more comprehensive in production)
        # These ranges can be derived from the training data statistics
        self.crop_optimal_ranges = {
            'rice': {'temperature': (20, 30), 'humidity': (80, 100), 'ph': (5.5, 7.5), 'rainfall': (200, 300)},
            'maize': {'temperature': (18, 28), 'humidity': (50, 75), 'ph': (5.5, 7.5), 'rainfall': (80, 150)},
            'wheat': {'temperature': (15, 25), 'humidity': (50, 70), 'ph': (6.0, 7.5), 'rainfall': (60, 100)},
            # Add more crops as needed
        }
    
    def _load_model(self, model_path):
        """Load the trained model from the specified path."""
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            return model
        except FileNotFoundError:
            print(f"Model file not found at {model_path}")
            print("Trying to load alternative model...")
            try:
                with open('models/RandomForest_test.pkl', 'rb') as f:
                    model = pickle.load(f)
                return model
            except FileNotFoundError:
                raise FileNotFoundError("No model file found. Please train the model first.")
    
    def predict(self, nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, top_n=3):
        """
        Predict top N crop recommendations based on soil and weather parameters.
        
        Parameters:
        -----------
        nitrogen : float
            Nitrogen content in soil (kg/ha)
        phosphorus : float
            Phosphorus content in soil (kg/ha)
        potassium : float
            Potassium content in soil (kg/ha)
        temperature : float
            Temperature in degrees Celsius
        humidity : float
            Relative humidity in percentage
        ph : float
            pH value of soil
        rainfall : float
            Rainfall in mm
        top_n : int, optional (default=3)
            Number of top recommendations to return
            
        Returns:
        --------
        tuple
            (top_crop, recommendations_df, input_data)
        """
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
        prediction = self.model.predict(input_data)
        probabilities = self.model.predict_proba(input_data)[0]
        
        # Get top N predictions with probabilities
        recommendations = pd.DataFrame({
            'crop': self.model.classes_,
            'confidence': probabilities * 100  # Convert to percentage
        }).sort_values(by='confidence', ascending=False).head(top_n)
        
        # Round confidence scores to 2 decimal places
        recommendations['confidence'] = recommendations['confidence'].round(2)
        
        # Add crop suitability analysis
        recommendations['recommendation_details'] = recommendations['crop'].apply(
            lambda crop: self._generate_recommendation_details(crop, input_data)
        )
        
        # Rank the recommendations
        recommendations['rank'] = range(1, len(recommendations) + 1)
        
        return prediction[0], recommendations, input_data
    
    def _generate_recommendation_details(self, crop, input_data):
        """Generate detailed explanation for the crop recommendation."""
        # This would be more sophisticated in a production environment
        # Here we're providing a simplified version
        details = f"The model has identified {crop} as a suitable crop based on the provided soil and weather conditions."
        
        # Add feature importance insights if available
        if self.feature_importance is not None:
            top_feature = self.feature_importance.iloc[0]['Feature']
            details += f" The most important factor in this decision was {top_feature}."
        
        # Add specific insights based on the crop
        if crop.lower() in self.crop_optimal_ranges:
            optimal_temp = self.crop_optimal_ranges[crop.lower()]['temperature']
            actual_temp = input_data['temperature'].values[0]
            
            if optimal_temp[0] <= actual_temp <= optimal_temp[1]:
                details += f" The temperature of {actual_temp}°C is optimal for {crop}."
            elif actual_temp < optimal_temp[0]:
                details += f" The temperature of {actual_temp}°C is slightly below the optimal range for {crop}."
            else:
                details += f" The temperature of {actual_temp}°C is slightly above the optimal range for {crop}."
        
        return details
    
    def visualize_recommendations(self, recommendations, input_data, filename='recommendations/crop_recommendation.png'):
        """Create a visualization of the crop recommendations."""
        plt.figure(figsize=(12, 8))
        
        # Bar chart for confidence scores
        plt.subplot(2, 1, 1)
        sns.barplot(x='crop', y='confidence', hue='crop', data=recommendations, palette='viridis', legend=False)
        plt.title('Crop Recommendation Confidence Scores', fontsize=16)
        plt.xlabel('Crop', fontsize=12)
        plt.ylabel('Confidence (%)', fontsize=12)
        
        # Add text labels on top of bars
        for i, row in recommendations.iterrows():
            plt.text(i, row['confidence'] + 1, f"{row['confidence']}%", 
                    ha='center', va='bottom', fontsize=10)
        
        # Radar chart showing input parameters and their relationships
        plt.subplot(2, 1, 2)
        
        # Show input parameters
        input_summary = pd.DataFrame([
            ["Nitrogen", f"{input_data['N'].values[0]} kg/ha"],
            ["Phosphorus", f"{input_data['P'].values[0]} kg/ha"],
            ["Potassium", f"{input_data['K'].values[0]} kg/ha"],
            ["Temperature", f"{input_data['temperature'].values[0]} °C"],
            ["Humidity", f"{input_data['humidity'].values[0]} %"],
            ["pH", f"{input_data['ph'].values[0]}"],
            ["Rainfall", f"{input_data['rainfall'].values[0]} mm"]
        ], columns=["Parameter", "Value"])
        
        table = plt.table(cellText=input_summary.values,
                          colLabels=input_summary.columns,
                          loc='center',
                          cellLoc='center',
                          bbox=[0.2, 0.0, 0.6, 0.9])
        
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1.2, 1.2)
        
        plt.axis('off')
        plt.title('Input Parameters', fontsize=16)
        
        # plt.tight_layout()
        plt.subplots_adjust(left=0.1, right=0.9, bottom=0.2, top=0.9)
        
        plt.savefig(filename)
        plt.close()
        
        return filename

def main():
    """Main function to demonstrate the enhanced crop recommendation system."""
    print("Enhanced Crop Recommendation System\n")
    
    # Initialize recommender
    recommender = CropRecommender()
    print("Model loaded successfully!")
    
    while True:
        print("\n" + "="*50)
        print("Please enter soil and weather parameters:")
        print("(Enter 'q' to quit)")
        
        try:
            user_input = input("Enter nitrogen (kg/ha): ")
            if user_input.lower() == 'q':
                break
            nitrogen = float(user_input)
            
            phosphorus = float(input("Enter phosphorus (kg/ha): "))
            potassium = float(input("Enter potassium (kg/ha): "))
            temperature = float(input("Enter temperature (°C): "))
            humidity = float(input("Enter humidity (%): "))
            ph = float(input("Enter pH: "))
            rainfall = float(input("Enter rainfall (mm): "))
            
            # Get recommendations
            top_crop, recommendations, input_data = recommender.predict(
                nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall
            )
            
            # Display recommendations
            print("\n" + "="*50)
            print(f"CROP RECOMMENDATIONS")
            print("="*50)
            
            for i, row in recommendations.iterrows():
                print(f"\n{row['rank']}. {row['crop'].upper()} (Confidence: {row['confidence']}%)")
                print(f"   {row['recommendation_details']}")
            
            # Generate visualization
            viz_file = recommender.visualize_recommendations(recommendations, input_data)
            print(f"\nVisualization saved to {viz_file}")
            
        except ValueError:
            print("Invalid input. Please enter numeric values.")
        except Exception as e:
            print(f"An error occurred: {e}")
    
    print("\nThank you for using the Enhanced Crop Recommendation System!")

if __name__ == "__main__":
    main()