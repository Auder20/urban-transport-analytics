import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import List, Dict, Any, Tuple
import logging
from datetime import datetime, timedelta

from config.settings import settings
from utils.feature_engineering import feature_engineer

logger = logging.getLogger(__name__)


class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(settings.model_path, "anomaly_model.joblib")
        self.scaler_path = os.path.join(settings.model_path, "anomaly_scaler.joblib")
        self.feature_columns = []
        self.is_trained = False
        
    def load_model(self) -> bool:
        """Load trained anomaly detection model"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.is_trained = True
                logger.info("Anomaly detection model loaded successfully")
                return True
            else:
                logger.info("No trained anomaly model found")
                return False
        except Exception as e:
            logger.error(f"Error loading anomaly model: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save trained anomaly detection model"""
        try:
            os.makedirs(settings.model_path, exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            logger.info("Anomaly detection model saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving anomaly model: {e}")
            return False
    
    def prepare_anomaly_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for anomaly detection"""
        df = feature_engineer.create_anomaly_features(df)
        
        # Select numeric features for anomaly detection
        numeric_features = [
            'delay_minutes', 'hour_of_day', 'day_of_week', 'month',
            'is_weekend', 'is_peak_hour', 'route_frequency',
            'delay_z_score', 'time_delay_z_score'
        ]
        
        # Add route statistics if available
        route_stats_cols = ['route_mean_delay', 'route_std_delay', 'route_min_delay', 'route_max_delay']
        for col in route_stats_cols:
            if col in df.columns:
                numeric_features.append(col)
        
        # Add time statistics if available
        time_stats_cols = ['time_mean_delay', 'time_std_delay']
        for col in time_stats_cols:
            if col in df.columns:
                numeric_features.append(col)
        
        # Filter to available columns
        available_features = [col for col in numeric_features if col in df.columns]
        
        return df[available_features]
    
    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Train anomaly detection model"""
        try:
            if len(df) < settings.min_samples_for_training:
                return {
                    'success': False,
                    'message': f'Insufficient data. Need at least {settings.min_samples_for_training} samples, got {len(df)}'
                }
            
            # Prepare features
            df_features = self.prepare_anomaly_features(df)
            
            # Handle missing values
            df_features = df_features.fillna(df_features.mean())
            
            # Standardize features
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(df_features)
            
            # Store feature columns
            self.feature_columns = list(df_features.columns)
            
            # Train Isolation Forest
            self.model = IsolationForest(
                contamination=0.1,  # Expect 10% anomalies
                random_state=42,
                n_estimators=100
            )
            self.model.fit(X_scaled)
            
            # Save model
            if self.save_model():
                self.is_trained = True
                
                return {
                    'success': True,
                    'training_samples': len(df),
                    'feature_count': len(self.feature_columns),
                    'contamination': 0.1
                }
            else:
                return {'success': False, 'message': 'Failed to save model'}
                
        except Exception as e:
            logger.error(f"Anomaly training error: {e}")
            return {'success': False, 'message': str(e)}
    
    def detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in trip data"""
        try:
            if not self.is_trained:
                return []
            
            # Prepare features
            df_features = self.prepare_anomaly_features(df)
            
            # Handle missing values
            df_features = df_features.fillna(0)
            
            # Ensure all required features are present
            missing_features = set(self.feature_columns) - set(df_features.columns)
            if missing_features:
                for feature in missing_features:
                    df_features[feature] = 0
            
            # Select features in correct order
            X = df_features[self.feature_columns]
            
            # Standardize
            X_scaled = self.scaler.transform(X)
            
            # Predict anomalies
            anomaly_labels = self.model.predict(X_scaled)  # -1 for anomalies, 1 for normal
            anomaly_scores = self.model.decision_function(X_scaled)
            
            # Create anomaly results
            anomalies = []
            for i, (label, score) in enumerate(zip(anomaly_labels, anomaly_scores)):
                if label == -1:  # Anomaly detected
                    row = df.iloc[i]
                    anomaly_type = self._classify_anomaly(row, score)
                    severity = self._assess_severity(row, score)
                    
                    anomalies.append({
                        'trip_id': row.get('id', f'trip_{i}'),
                        'route_id': row.get('route_id', ''),
                        'timestamp': row.get('started_at', datetime.now()),
                        'delay_minutes': row.get('delay_minutes', 0),
                        'anomaly_score': float(abs(score)),
                        'anomaly_type': anomaly_type,
                        'severity': severity,
                        'description': self._generate_description(row, anomaly_type, severity)
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Anomaly detection error: {e}")
            return []
    
    def _classify_anomaly(self, row: pd.Series, score: float) -> str:
        """Classify the type of anomaly"""
        delay = row.get('delay_minutes', 0)
        hour = row.get('hour_of_day', 0)
        
        if delay > 60:
            return 'extreme_delay'
        elif delay > 30:
            return 'severe_delay'
        elif delay > 15:
            return 'moderate_delay'
        elif hour >= 22 or hour <= 5:
            return 'unusual_time'
        elif abs(score) > 3:
            return 'statistical_outlier'
        else:
            return 'pattern_deviation'
    
    def _assess_severity(self, row: pd.Series, score: float) -> str:
        """Assess severity of anomaly"""
        delay = row.get('delay_minutes', 0)
        
        if delay > 60 or abs(score) > 3:
            return 'critical'
        elif delay > 30 or abs(score) > 2:
            return 'high'
        elif delay > 15 or abs(score) > 1.5:
            return 'medium'
        else:
            return 'low'
    
    def _generate_description(self, row: pd.Series, anomaly_type: str, severity: str) -> str:
        """Generate human-readable description of anomaly"""
        delay = row.get('delay_minutes', 0)
        route_code = row.get('route_code', 'Unknown')
        
        descriptions = {
            'extreme_delay': f'Extreme delay of {delay:.1f} minutes on route {route_code}',
            'severe_delay': f'Severe delay of {delay:.1f} minutes on route {route_code}',
            'moderate_delay': f'Moderate delay of {delay:.1f} minutes on route {route_code}',
            'unusual_time': f'Unusual operating time for route {route_code}',
            'statistical_outlier': f'Statistical outlier detected on route {route_code}',
            'pattern_deviation': f'Deviation from normal pattern on route {route_code}'
        }
        
        base_desc = descriptions.get(anomaly_type, f'Anomaly detected on route {route_code}')
        return f'{severity.title()} severity: {base_desc}'


# Global anomaly detector instance
anomaly_detector = AnomalyDetector()
