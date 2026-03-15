import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from typing import Tuple, Dict, Any
import logging
from datetime import datetime

from config.settings import settings
from utils.feature_engineering import feature_engineer

logger = logging.getLogger(__name__)


class DelayPredictor:
    def __init__(self):
        self.model = None
        self.model_type = "random_forest"
        self.model_path = os.path.join(settings.model_path, "delay_model.joblib")
        self.feature_columns = []
        self.is_trained = False
        self.last_training_date = None
        
    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.feature_columns = model_data['features']
                self.model_type = model_data.get('type', 'random_forest')
                self.is_trained = True
                self.last_training_date = model_data.get('training_date')
                logger.info(f"Model loaded successfully from {self.model_path}")
                return True
            else:
                logger.info("No trained model found")
                return False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save trained model to disk"""
        try:
            os.makedirs(settings.model_path, exist_ok=True)
            model_data = {
                'model': self.model,
                'features': self.feature_columns,
                'type': self.model_type,
                'training_date': datetime.now().isoformat()
            }
            joblib.dump(model_data, self.model_path)
            logger.info(f"Model saved successfully to {self.model_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False
    
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for training"""
        return feature_engineer.prepare_delay_features(df)
    
    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Train the delay prediction model"""
        try:
            if len(df) < settings.min_samples_for_training:
                return {
                    'success': False,
                    'message': f'Insufficient data. Need at least {settings.min_samples_for_training} samples, got {len(df)}'
                }
            
            # Prepare features
            df_prepared = self.prepare_data(df)
            
            # Separate features and target
            if 'delay_minutes' not in df_prepared.columns:
                return {'success': False, 'message': 'Target variable delay_minutes not found'}
            
            X = df_prepared.drop('delay_minutes', axis=1)
            y = df_prepared['delay_minutes']
            
            # Store feature columns
            self.feature_columns = list(X.columns)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Train model
            self.model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Save model
            if self.save_model():
                self.is_trained = True
                self.last_training_date = datetime.now()
                
                return {
                    'success': True,
                    'model_version': f'rf_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                    'training_samples': len(df),
                    'accuracy_score': r2,
                    'mean_squared_error': mse,
                    'feature_count': len(self.feature_columns)
                }
            else:
                return {'success': False, 'message': 'Failed to save model'}
                
        except Exception as e:
            logger.error(f"Training error: {e}")
            return {'success': False, 'message': str(e)}
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make delay prediction"""
        try:
            if not self.is_trained:
                return {
                    'predicted_delay_minutes': 5.0,  # Default fallback
                    'confidence_interval': {'lower': 0.0, 'upper': 15.0},
                    'fallback_used': True
                }
            
            # Convert to DataFrame
            df = pd.DataFrame([features])
            
            # Prepare features
            df_prepared = feature_engineer.prepare_delay_features(df)
            
            # Ensure all required features are present
            missing_features = set(self.feature_columns) - set(df_prepared.columns)
            if missing_features:
                for feature in missing_features:
                    df_prepared[feature] = 0
            
            # Select only required features in correct order
            X = df_prepared[self.feature_columns]
            
            # Make prediction
            prediction = self.model.predict(X)[0]
            
            # Simple confidence interval (would be more sophisticated in production)
            std_error = np.sqrt(mean_squared_error([prediction], [prediction])) if prediction > 0 else 2.0
            confidence_interval = {
                'lower': max(0, prediction - 1.96 * std_error),
                'upper': prediction + 1.96 * std_error
            }
            
            return {
                'predicted_delay_minutes': float(prediction),
                'confidence_interval': confidence_interval,
                'fallback_used': False
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'predicted_delay_minutes': 5.0,
                'confidence_interval': {'lower': 0.0, 'upper': 15.0},
                'fallback_used': True,
                'error': str(e)
            }


# Global predictor instance
delay_predictor = DelayPredictor()
