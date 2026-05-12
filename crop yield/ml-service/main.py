from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import shap
import joblib
import os
from pathlib import Path

app = FastAPI()

# Data file path
DATA_DIR = Path(__file__).parent / "data"
CSV_FILE = DATA_DIR / "crop_yield_data.csv"

# Indian states/regions for crop yield prediction
REGIONS = [
    "Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Madhya Pradesh",
    "Gujarat", "Rajasthan", "West Bengal", "Tamil Nadu", "Karnataka",
    "Andhra Pradesh", "Telangana", "Bihar", "Odisha", "Kerala", "Assam",
    "Chhattisgarh", "Jharkhand", "Himachal Pradesh", "Uttarakhand", "Jammu Kashmir"
]
CROPS = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut", "Pulses", "Barley", "Millet"]
SEASONS = ["Kharif", "Rabi", "Zaid", "Summer", "Winter", "Monsoon"]
SOIL_TYPES = ["Alluvial", "Black", "Red", "Laterite", "Desert", "Mountain", "Clay", "Sandy", "Loamy"]

# Label encoders
region_encoder = LabelEncoder()
crop_encoder = LabelEncoder()
season_encoder = LabelEncoder()
soil_encoder = LabelEncoder()

region_encoder.fit(REGIONS)
crop_encoder.fit(CROPS)
season_encoder.fit(SEASONS)
soil_encoder.fit(SOIL_TYPES)

# Global model variables
yield_model = None
risk_model = None
explainer = None
training_data_info = {}

MODEL_DIR = Path(__file__).parent / "models"

class PredictionRequest(BaseModel):
    region: str
    crop: str
    season: str
    soil_type: str
    temperature: float
    humidity: float
    rainfall: float


def load_csv_data():
    """Load real crop yield data from CSV file"""
    if not CSV_FILE.exists():
        print(f"CSV file not found at {CSV_FILE}")
        return None
    
    try:
        df = pd.read_csv(CSV_FILE)
        required_cols = ['region', 'crop', 'season', 'soil_type', 'temperature', 'humidity', 'rainfall', 'yield', 'risk']
        
        if not all(col in df.columns for col in required_cols):
            print(f"CSV missing required columns. Required: {required_cols}")
            return None
        
        print(f"Loaded {len(df)} records from CSV")
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return None


def augment_data(df, augmentation_factor=10):
    """Augment the dataset by adding variations to existing records"""
    np.random.seed(42)
    augmented_rows = []
    
    for _, row in df.iterrows():
        for _ in range(augmentation_factor):
            new_row = row.copy()
            # Add small variations to numerical features
            new_row['temperature'] = row['temperature'] + np.random.normal(0, 1.5)
            new_row['humidity'] = np.clip(row['humidity'] + np.random.normal(0, 3), 20, 100)
            new_row['rainfall'] = np.clip(row['rainfall'] + np.random.normal(0, 20), 20, 600)
            
            # Adjust yield based on variations
            temp_diff = new_row['temperature'] - row['temperature']
            rain_diff = new_row['rainfall'] - row['rainfall']
            
            yield_adjustment = 1.0
            # Temperature impact
            if abs(temp_diff) > 2:
                yield_adjustment *= (1 - abs(temp_diff) * 0.02)
            # Rainfall impact
            yield_adjustment *= (1 + rain_diff * 0.001)
            
            new_row['yield'] = np.clip(row['yield'] * yield_adjustment + np.random.normal(0, 50), 300, 8000)
            
            # Adjust risk based on conditions
            risk_adjustment = 0
            if new_row['temperature'] < 15 or new_row['temperature'] > 38:
                risk_adjustment += 0.1
            if new_row['humidity'] < 35 or new_row['humidity'] > 92:
                risk_adjustment += 0.05
            new_row['risk'] = np.clip(row['risk'] + risk_adjustment + np.random.uniform(-0.03, 0.05), 0.05, 0.95)
            
            augmented_rows.append(new_row)
    
    augmented_df = pd.DataFrame(augmented_rows)
    combined_df = pd.concat([df, augmented_df], ignore_index=True)
    print(f"Augmented dataset from {len(df)} to {len(combined_df)} records")
    return combined_df


def generate_synthetic_data(n_samples=5000):
    """Generate realistic synthetic crop yield data for training"""
    np.random.seed(42)
    
    data = {
        'region': np.random.choice(REGIONS, n_samples),
        'crop': np.random.choice(CROPS, n_samples),
        'season': np.random.choice(SEASONS, n_samples),
        'soil_type': np.random.choice(SOIL_TYPES, n_samples),
        'temperature': np.random.uniform(15, 40, n_samples),
        'humidity': np.random.uniform(30, 95, n_samples),
        'rainfall': np.random.uniform(50, 500, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Create realistic yield based on features
    base_yields = {
        'Rice': 2800, 'Wheat': 2200, 'Maize': 2500, 'Cotton': 1500,
        'Sugarcane': 4500, 'Soybean': 1800, 'Groundnut': 1600,
        'Pulses': 1200, 'Barley': 1900, 'Millet': 1400
    }
    
    season_multipliers = {
        'Kharif': 1.1, 'Rabi': 1.0, 'Zaid': 0.85, 
        'Summer': 0.9, 'Winter': 0.95, 'Monsoon': 1.15
    }
    
    soil_multipliers = {
        'Alluvial': 1.2, 'Black': 1.15, 'Red': 0.95, 'Laterite': 0.85,
        'Desert': 0.7, 'Mountain': 0.8, 'Clay': 1.0, 'Sandy': 0.75, 'Loamy': 1.1
    }
    
    yields = []
    risks = []
    
    for _, row in df.iterrows():
        base = base_yields.get(row['crop'], 1500)
        season_mult = season_multipliers.get(row['season'], 1.0)
        soil_mult = soil_multipliers.get(row['soil_type'], 1.0)
        
        # Temperature impact (optimal around 25-30°C for most crops)
        temp = row['temperature']
        if 22 <= temp <= 32:
            temp_factor = 1.0
        elif temp < 22:
            temp_factor = 0.85 + (temp - 15) * 0.015
        else:
            temp_factor = 1.0 - (temp - 32) * 0.02
        temp_factor = max(0.5, min(1.2, temp_factor))
        
        # Humidity impact (optimal 50-80%)
        hum = row['humidity']
        if 50 <= hum <= 80:
            hum_factor = 1.0
        elif hum < 50:
            hum_factor = 0.8 + hum * 0.004
        else:
            hum_factor = 1.0 - (hum - 80) * 0.01
        hum_factor = max(0.6, min(1.1, hum_factor))
        
        # Rainfall impact (varies by crop)
        rain = row['rainfall']
        optimal_rain = {'Rice': 350, 'Wheat': 150, 'Maize': 200, 'Cotton': 180,
                       'Sugarcane': 400, 'Soybean': 220, 'Groundnut': 160,
                       'Pulses': 140, 'Barley': 130, 'Millet': 120}
        opt_rain = optimal_rain.get(row['crop'], 200)
        rain_diff = abs(rain - opt_rain) / opt_rain
        rain_factor = max(0.5, 1.0 - rain_diff * 0.4)
        
        # Calculate yield with some noise
        crop_yield = base * season_mult * soil_mult * temp_factor * hum_factor * rain_factor
        crop_yield += np.random.normal(0, crop_yield * 0.08)  # 8% noise
        yields.append(max(300, crop_yield))
        
        # Calculate risk score (0-1)
        risk = 0.1  # base risk
        if temp < 18 or temp > 38:
            risk += 0.2
        if hum < 40 or hum > 90:
            risk += 0.15
        if rain_diff > 0.5:
            risk += 0.2
        if row['soil_type'] in ['Desert', 'Sandy']:
            risk += 0.1
        risk += np.random.uniform(-0.05, 0.1)
        risks.append(max(0.05, min(0.95, risk)))
    
    df['yield'] = yields
    df['risk'] = risks
    
    return df


def prepare_features(df):
    """Encode categorical features"""
    X = df.copy()
    
    # Handle unknown categories gracefully
    X['region_encoded'] = X['region'].apply(
        lambda x: region_encoder.transform([x])[0] if x in REGIONS else len(REGIONS)
    )
    X['crop_encoded'] = X['crop'].apply(
        lambda x: crop_encoder.transform([x])[0] if x in CROPS else len(CROPS)
    )
    X['season_encoded'] = X['season'].apply(
        lambda x: season_encoder.transform([x])[0] if x in SEASONS else len(SEASONS)
    )
    X['soil_encoded'] = X['soil_type'].apply(
        lambda x: soil_encoder.transform([x])[0] if x in SOIL_TYPES else len(SOIL_TYPES)
    )
    
    feature_cols = ['region_encoded', 'crop_encoded', 'season_encoded', 'soil_encoded',
                    'temperature', 'humidity', 'rainfall']
    
    return X[feature_cols]


def load_models():
    """Load pre-trained models from disk"""
    global yield_model, risk_model, explainer, training_data_info
    
    yield_model_path = MODEL_DIR / 'yield_model.pkl'
    risk_model_path = MODEL_DIR / 'risk_model.pkl'
    
    if not yield_model_path.exists() or not risk_model_path.exists():
        print("Models not found. Please run train.py first.")
        raise FileNotFoundError("Run 'python train.py' to generate models before starting the server.")
        
    print(f"Loading models from {MODEL_DIR}...")
    yield_model = joblib.load(yield_model_path)
    risk_model = joblib.load(risk_model_path)
    
    # Initialize SHAP explainer
    print("Initializing SHAP explainer...")
    explainer = shap.TreeExplainer(yield_model)
    
    training_data_info = {
        "source": "Pre-trained models (joblib)",
        "yield_model_path": str(yield_model_path),
        "risk_model_path": str(risk_model_path)
    }
    
    print("Models loaded successfully!")

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()


@app.get("/")
def read_root():
    return {"message": "Crop Yield ML Service is running (Random Forest Model)"}


@app.post("/predict")
def predict_yield(request: PredictionRequest):
    global yield_model, risk_model, explainer
    
    # Prepare input features
    input_data = pd.DataFrame([{
        'region': request.region,
        'crop': request.crop,
        'season': request.season,
        'soil_type': request.soil_type,
        'temperature': request.temperature,
        'humidity': request.humidity,
        'rainfall': request.rainfall
    }])
    
    X = prepare_features(input_data)
    
    # Predict yield
    predicted_yield = yield_model.predict(X)[0]
    
    # Predict risk
    risk_score = risk_model.predict(X)[0]
    risk_score = max(0.05, min(0.95, risk_score))
    
    # Calculate SHAP values for explainability
    shap_values_array = explainer.shap_values(X)
    
    feature_names = ['region', 'crop', 'season', 'soil_type', 'temperature', 'humidity', 'rainfall']
    shap_dict = {}
    for i, name in enumerate(feature_names):
        shap_dict[name] = round(float(shap_values_array[0][i]) / 100, 2)  # Normalize for display
    
    # Profit estimation (Yield * 25 INR - 10000 cost)
    profit_estimation = max(0, (predicted_yield * 25) - 10000)
    
    # Generate explanation based on SHAP values
    sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_features = sorted_features[:3]
    
    explanation = f"The predicted yield for {request.crop} in {request.region} is {predicted_yield:.0f} kg/hectare. "
    explanation += "Key factors: "
    
    factor_explanations = []
    for feat, val in top_features:
        if feat == 'rainfall':
            if val > 0:
                factor_explanations.append("favorable rainfall conditions")
            else:
                factor_explanations.append("suboptimal rainfall levels")
        elif feat == 'temperature':
            if val > 0:
                factor_explanations.append("suitable temperature range")
            else:
                factor_explanations.append("temperature stress on crops")
        elif feat == 'humidity':
            if val > 0:
                factor_explanations.append("optimal humidity levels")
            else:
                factor_explanations.append("humidity concerns")
        elif feat == 'soil_type':
            if val > 0:
                factor_explanations.append(f"favorable {request.soil_type} soil")
            else:
                factor_explanations.append(f"soil type limitations")
        elif feat == 'season':
            if val > 0:
                factor_explanations.append(f"good {request.season} season timing")
            else:
                factor_explanations.append("seasonal timing challenges")
        elif feat == 'crop':
            factor_explanations.append(f"{request.crop}'s yield characteristics")
        elif feat == 'region':
            factor_explanations.append(f"regional growing conditions in {request.region}")
    
    explanation += ", ".join(factor_explanations) + "."
    
    if risk_score > 0.4:
        explanation += f" Note: Risk level is elevated ({risk_score:.0%}), consider risk mitigation strategies."

    return {
        "predicted_yield": round(predicted_yield, 2),
        "risk_score": round(risk_score, 2),
        "profit_estimation": round(profit_estimation, 2),
        "shap_values": shap_dict,
        "explanation": explanation
    }


@app.get("/model-info")
def get_model_info():
    """Get information about the trained model"""
    if yield_model is None:
        return {"error": "Model not trained yet"}
    
    feature_importance = dict(zip(
        ['region', 'crop', 'season', 'soil_type', 'temperature', 'humidity', 'rainfall'],
        yield_model.feature_importances_.tolist()
    ))
    
    return {
        "model_type": "Random Forest Regressor",
        "n_estimators": yield_model.n_estimators,
        "max_depth": yield_model.max_depth,
        "feature_importance": feature_importance,
        "risk_model_type": "Gradient Boosting Regressor"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
