import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from pathlib import Path

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

DATA_DIR = Path(__file__).parent / "data"
CSV_FILE = DATA_DIR / "crop_yield_data.csv"

def augment_data(df, augmentation_factor=10):
    np.random.seed(42)
    augmented_rows = []
    
    for _, row in df.iterrows():
        for _ in range(augmentation_factor):
            new_row = row.copy()
            new_row['temperature'] = row['temperature'] + np.random.normal(0, 1.5)
            new_row['humidity'] = np.clip(row['humidity'] + np.random.normal(0, 3), 20, 100)
            new_row['rainfall'] = np.clip(row['rainfall'] + np.random.normal(0, 20), 20, 600)
            
            temp_diff = new_row['temperature'] - row['temperature']
            rain_diff = new_row['rainfall'] - row['rainfall']
            
            yield_adjustment = 1.0
            if abs(temp_diff) > 2:
                yield_adjustment *= (1 - abs(temp_diff) * 0.02)
            yield_adjustment *= (1 + rain_diff * 0.001)
            
            new_row['yield'] = np.clip(row['yield'] * yield_adjustment + np.random.normal(0, 50), 300, 8000)
            
            risk_adjustment = 0
            if new_row['temperature'] < 15 or new_row['temperature'] > 38:
                risk_adjustment += 0.1
            if new_row['humidity'] < 35 or new_row['humidity'] > 92:
                risk_adjustment += 0.05
            new_row['risk'] = np.clip(row['risk'] + risk_adjustment + np.random.uniform(-0.03, 0.05), 0.05, 0.95)
            
            augmented_rows.append(new_row)
    
    augmented_df = pd.DataFrame(augmented_rows)
    combined_df = pd.concat([df, augmented_df], ignore_index=True)
    return combined_df

def prepare_features(df):
    X = df.copy()
    X['region_encoded'] = X['region'].apply(lambda x: region_encoder.transform([x])[0] if x in REGIONS else len(REGIONS))
    X['crop_encoded'] = X['crop'].apply(lambda x: crop_encoder.transform([x])[0] if x in CROPS else len(CROPS))
    X['season_encoded'] = X['season'].apply(lambda x: season_encoder.transform([x])[0] if x in SEASONS else len(SEASONS))
    X['soil_encoded'] = X['soil_type'].apply(lambda x: soil_encoder.transform([x])[0] if x in SOIL_TYPES else len(SOIL_TYPES))
    
    feature_cols = ['region_encoded', 'crop_encoded', 'season_encoded', 'soil_encoded',
                    'temperature', 'humidity', 'rainfall']
    return X[feature_cols]

if __name__ == "__main__":
    print(f"Loading dataset from {CSV_FILE}...")
    df = pd.read_csv(CSV_FILE)
    print(f"Original shape: {df.shape}")
    
    df = augment_data(df, augmentation_factor=15)
    print(f"Augmented shape: {df.shape}")
    
    X = prepare_features(df)
    y_yield = df['yield']
    y_risk = df['risk']
    
    print("Training yield model (Random Forest)...")
    yield_model = RandomForestRegressor(n_estimators=150, max_depth=18, min_samples_split=4, min_samples_leaf=2, random_state=42, n_jobs=-1)
    yield_model.fit(X, y_yield)
    
    print("Training risk model (Gradient Boosting)...")
    risk_model = GradientBoostingRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    risk_model.fit(X, y_risk)
    
    model_dir = Path(__file__).parent / "models"
    model_dir.mkdir(exist_ok=True)
    
    joblib.dump(yield_model, model_dir / 'yield_model.pkl')
    joblib.dump(risk_model, model_dir / 'risk_model.pkl')
    
    print("Training complete! Model files saved in 'models/' directory.")

