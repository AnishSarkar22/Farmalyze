# Use this to train model for crop recommendation instead of train_crop_model.py
"""
Crop Recommendation Model Training

This script trains and evaluates an optimized Random Forest model for crop recommendation
with a focus on achieving very high accuracy and providing 3 sorted recommendations.

Requirements:
- scikit-learn
- pandas
- numpy
- matplotlib
- seaborn
- optuna (for advanced hyperparameter optimization)

Usage:
1. Place the Crop_recommendation.csv file in the Data directory
2. Run this script: python enhanced_train_model.py
3. The trained model will be saved as 'models/EnhancedRandomForest.pkl'
"""

import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, RepeatedStratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV

# Create directories if they don't exist
os.makedirs('models', exist_ok=True)
os.makedirs('plots', exist_ok=True)

def load_and_explore_data(data_path='../Data/Crop_recommendation.csv'):
    """Load and explore the dataset with detailed analysis."""
    print("Loading dataset...")
    
    # Load the dataset
    df = pd.read_csv(data_path)
    
    # Display basic information
    print(f"Dataset shape: {df.shape}")
    print("\nFirst few rows:")
    print(df.head())
    
    print("\nStatistical summary:")
    print(df.describe())
    
    print("\nChecking for missing values:")
    missing_values = df.isnull().sum()
    print(missing_values)
    
    # Check for duplicate rows
    duplicates = df.duplicated().sum()
    print(f"\nNumber of duplicate rows: {duplicates}")
    
    # Data exploration
    print("\nUnique crops in dataset:")
    unique_crops = df['label'].unique()
    print(f"Number of unique crops: {len(unique_crops)}")
    print(unique_crops)
    
    # Distribution of crops
    crop_counts = df['label'].value_counts()
    print("\nCrop distribution:")
    print(crop_counts)
    
    # Generate exploratory plots
    generate_exploratory_plots(df)
    
    return df

def generate_exploratory_plots(df):
    """Generate detailed exploratory plots for data analysis."""
    # Count plot for crops
    plt.figure(figsize=(14, 7))
    ax = sns.countplot(x='label', data=df)
    plt.title('Crop Distribution', fontsize=16)
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig('plots/crop_distribution.png')
    plt.close()
    
    # Feature correlation
    plt.figure(figsize=(12, 10))
    correlation = df.select_dtypes(include=[np.number]).corr()
    mask = np.triu(np.ones_like(correlation, dtype=bool))
    sns.heatmap(correlation, annot=True, cmap='coolwarm', fmt='.2f', mask=mask)
    plt.title('Feature Correlation Matrix', fontsize=16)
    plt.tight_layout()
    plt.savefig('plots/feature_correlation.png')
    plt.close()
    
    # Pairplot for key features
    sns.pairplot(df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].sample(500), height=2)
    plt.suptitle('Pairwise Relationships Between Features', y=1.02, fontsize=16)
    plt.tight_layout()
    plt.savefig('plots/feature_pairplot.png')
    plt.close()
    
    # Box plots for all features by crop (for top crops)
    top_crops = df['label'].value_counts().nlargest(6).index
    for feature in ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']:
        plt.figure(figsize=(14, 7))
        sns.boxplot(x='label', y=feature, data=df[df['label'].isin(top_crops)])
        plt.title(f'{feature} Distribution by Top Crops', fontsize=16)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(f'plots/{feature}_by_crop.png')
        plt.close()
    
    # Feature distribution with respect to crops
    plt.figure(figsize=(18, 14))
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    for i, feature in enumerate(features):
        plt.subplot(3, 3, i+1)
        for crop in top_crops:
            sns.kdeplot(df[df['label'] == crop][feature], label=crop)
        plt.title(f'{feature} Distribution by Crop')
        plt.legend(loc='best', fontsize='x-small')
    
    plt.tight_layout()
    plt.savefig('plots/feature_distribution_by_crop.png')
    plt.close()

def prepare_data(df):
    """Prepare data for modeling with proper stratification."""
    print("\nPreparing data for modeling...")
    X = df.drop('label', axis=1)
    y = df['label']
    
    # Split data with stratification to ensure balanced representation of all crops
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {X_train.shape}")
    print(f"Testing set size: {X_test.shape}")
    
    # Check class distribution in train and test sets
    train_distribution = pd.Series(y_train).value_counts(normalize=True)
    test_distribution = pd.Series(y_test).value_counts(normalize=True)
    
    print("\nClass distribution in training set:")
    print(train_distribution)
    print("\nClass distribution in test set:")
    print(test_distribution)
    
    return X_train, X_test, y_train, y_test

def train_optimized_model(X_train, y_train):
    """Train an optimized model with extensive hyperparameter tuning."""
    print("\nTraining optimized Random Forest model...")
    
    # Define parameter grid for extensive search
    param_grid = {
        'n_estimators': [200, 300, 400, 500],
        'max_depth': [None, 20, 30, 40],
        'min_samples_split': [2, 3, 5],
        'min_samples_leaf': [1, 2, 4],
        'max_features': ['sqrt', 'log2', None],
        'bootstrap': [True, False],
        'class_weight': ['balanced', 'balanced_subsample', None]
    }
    
    # Use StratifiedKFold for more robust cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    # Initialize RandomForestClassifier
    rf = RandomForestClassifier(random_state=42)
    
    # Perform grid search with cross-validation
    print("\nPerforming extensive hyperparameter tuning...")
    print("This may take several minutes...")
    
    grid_search = GridSearchCV(
        estimator=rf,
        param_grid=param_grid,
        cv=cv,
        scoring='accuracy',
        n_jobs=-1,
        verbose=2
    )
    
    grid_search.fit(X_train, y_train)
    
    print(f"\nBest parameters: {grid_search.best_params_}")
    print(f"Best cross-validation score: {grid_search.best_score_:.4f}")
    
    # Train final model with best parameters
    best_rf = grid_search.best_estimator_
    
    # Additional cross-validation with repeated stratified k-fold
    print("\nPerforming additional cross-validation with repeated stratified k-fold...")
    repeated_cv = RepeatedStratifiedKFold(n_splits=10, n_repeats=3, random_state=42)
    cv_scores = cross_val_score(best_rf, X_train, y_train, cv=repeated_cv, scoring='accuracy')
    
    print(f"Cross-validation scores: {cv_scores}")
    print(f"Mean CV score: {cv_scores.mean():.4f}")
    print(f"Standard deviation: {cv_scores.std():.4f}")
    
    # Retrain on full training set
    best_rf.fit(X_train, y_train)
    
    return best_rf, grid_search.best_params_

def evaluate_model(model, X_test, y_test, crop_names):
    """Evaluate model with detailed metrics and visualizations."""
    print("\nEvaluating model on test set...")
    y_pred = model.predict(X_test)
    
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Confusion Matrix
    plt.figure(figsize=(14, 12))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=crop_names, yticklabels=crop_names)
    plt.xlabel('Predicted', fontsize=12)
    plt.ylabel('Actual', fontsize=12)
    plt.title('Confusion Matrix', fontsize=16)
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig('plots/confusion_matrix.png')
    plt.close()
    
    # Feature importance
    plt.figure(figsize=(12, 8))
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    features = X_test.columns
    
    plt.title('Feature Importance', fontsize=16)
    plt.bar(range(X_test.shape[1]), importances[indices], align='center')
    plt.xticks(range(X_test.shape[1]), [features[i] for i in indices], rotation=90)
    plt.ylabel('Importance Score', fontsize=12)
    plt.tight_layout()
    plt.savefig('plots/feature_importance.png')
    plt.close()
    
    # Feature importance table
    importance_df = pd.DataFrame({
        'Feature': features,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print("\nFeature Importance:")
    print(importance_df)
    
    return importance_df

def create_alternative_models(X_train, X_test, y_train, y_test):
    """Create and evaluate alternative models for comparison."""
    print("\nTraining alternative model (Gradient Boosting) for comparison...")
    
    # Train Gradient Boosting model
    gb = GradientBoostingClassifier(random_state=42)
    gb.fit(X_train, y_train)
    
    # Evaluate
    gb_pred = gb.predict(X_test)
    gb_acc = accuracy_score(y_test, gb_pred)
    
    print(f"Gradient Boosting accuracy: {gb_acc:.4f}")
    
    return gb

def main():
    """Main function to orchestrate the entire modeling process."""
    print("Enhanced Crop Recommendation System Training\n")
    
    # Load and explore data
    df = load_and_explore_data()
    
    # Prepare data
    X_train, X_test, y_train, y_test = prepare_data(df)
    
    # Train optimized model
    best_model, best_params = train_optimized_model(X_train, y_train)
    
    # Evaluate model
    importance_df = evaluate_model(best_model, X_test, y_test, df['label'].unique())
    
    # Train alternative model for comparison
    alt_model = create_alternative_models(X_train, X_test, y_train, y_test)
    
    # Save the model
    print("\nSaving the optimized model...")
    with open('../models/EnhancedRandomForest.pkl', 'wb') as f:
        pickle.dump(best_model, f)
    
    # Save feature importance information
    importance_df.to_csv('models/feature_importance.csv', index=False)
    
    print("\nModel saved to models/EnhancedRandomForest.pkl")
    print("Feature importance saved to models/feature_importance.csv")
    print("\nTraining complete!")

if __name__ == "__main__":
    main()