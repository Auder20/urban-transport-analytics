import pandas as pd
import numpy as np
from datetime import datetime, time
from typing import Dict, Any
import pytz


class FeatureEngineer:
    """Feature engineering for transport analytics"""
    
    def __init__(self):
        self.timezone = pytz.timezone('America/Bogota')  # Default timezone
    
    def extract_temporal_features(self, df: pd.DataFrame, timestamp_col: str = 'started_at') -> pd.DataFrame:
        """Extract temporal features from timestamp"""
        df = df.copy()
        
        # Convert to datetime if needed
        df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        
        # Extract features
        df['hour_of_day'] = df[timestamp_col].dt.hour
        df['day_of_week'] = df[timestamp_col].dt.dayofweek  # 0=Monday, 6=Sunday
        df['month'] = df[timestamp_col].dt.month
        df['quarter'] = df[timestamp_col].dt.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Peak hours (7-9 AM and 5-7 PM)
        df['is_morning_peak'] = ((df['hour_of_day'] >= 7) & (df['hour_of_day'] <= 9)).astype(int)
        df['is_evening_peak'] = ((df['hour_of_day'] >= 17) & (df['hour_of_day'] <= 19)).astype(int)
        df['is_peak_hour'] = (df['is_morning_peak'] | df['is_evening_peak']).astype(int)
        
        # Time of day categories
        def get_time_period(hour):
            if 6 <= hour < 12:
                return 'morning'
            elif 12 <= hour < 18:
                return 'afternoon'
            elif 18 <= hour < 22:
                return 'evening'
            else:
                return 'night'
        
        df['time_period'] = df['hour_of_day'].apply(get_time_period)
        
        return df
    
    def encode_route_features(self, df: pd.DataFrame, route_col: str = 'route_id') -> pd.DataFrame:
        """Encode route features"""
        df = df.copy()
        
        # Route frequency encoding
        route_counts = df[route_col].value_counts()
        df['route_frequency'] = df[route_col].map(route_counts)
        
        # Route mean delay (if delay column exists)
        if 'delay_minutes' in df.columns:
            route_mean_delay = df.groupby(route_col)['delay_minutes'].mean()
            df['route_mean_delay'] = df[route_col].map(route_mean_delay)
        
        return df
    
    def create_weather_features(self, df: pd.DataFrame, timestamp_col: str = 'started_at') -> pd.DataFrame:
        """Create weather-related features (placeholder for real weather data)"""
        df = df.copy()
        
        # Season based on month (Northern Hemisphere)
        def get_season(month):
            if month in [12, 1, 2]:
                return 'winter'
            elif month in [3, 4, 5]:
                return 'spring'
            elif month in [6, 7, 8]:
                return 'summer'
            else:
                return 'autumn'
        
        df['season'] = df[timestamp_col].dt.month.apply(get_season)
        
        # Holiday indicator (simplified - would need real holiday calendar)
        df['is_holiday'] = 0  # Placeholder
        
        return df
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features"""
        df = df.copy()
        
        # Hour x Day of week interaction
        df['hour_day_interaction'] = df['hour_of_day'] * df['day_of_week']
        
        # Peak hour x Weekend interaction
        df['peak_weekend_interaction'] = df['is_peak_hour'] * df['is_weekend']
        
        # Route frequency x Peak hour interaction
        if 'route_frequency' in df.columns:
            df['route_freq_peak_interaction'] = df['route_frequency'] * df['is_peak_hour']
        
        return df
    
    def prepare_delay_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features specifically for delay prediction"""
        df = df.copy()
        
        # Extract temporal features
        df = self.extract_temporal_features(df)
        
        # Encode route features
        df = self.encode_route_features(df)
        
        # Add weather features
        df = self.create_weather_features(df)
        
        # Create interactions
        df = self.create_interaction_features(df)
        
        # One-hot encode categorical variables
        categorical_cols = ['time_period', 'season']
        df = pd.get_dummies(df, columns=categorical_cols, prefix=categorical_cols)
        
        # Select numeric features for modeling
        numeric_features = [
            'hour_of_day', 'day_of_week', 'month', 'quarter',
            'is_weekend', 'is_morning_peak', 'is_evening_peak', 'is_peak_hour',
            'route_frequency', 'hour_day_interaction', 'peak_weekend_interaction'
        ]
        
        # Add one-hot encoded columns if they exist
        for col in df.columns:
            if any(prefix in col for prefix in categorical_cols):
                numeric_features.append(col)
        
        # Add route mean delay if available
        if 'route_mean_delay' in df.columns:
            numeric_features.append('route_mean_delay')
        
        # Filter to only available columns
        available_features = [col for col in numeric_features if col in df.columns]
        
        return df[available_features + ['delay_minutes']] if 'delay_minutes' in df.columns else df[available_features]
    
    def create_anomaly_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features for anomaly detection"""
        df = df.copy()
        
        # Extract temporal features
        df = self.extract_temporal_features(df)
        
        # Route-based statistics
        route_stats = df.groupby('route_id').agg({
            'delay_minutes': ['mean', 'std', 'min', 'max']
        }).round(2)
        
        route_stats.columns = ['route_mean_delay', 'route_std_delay', 'route_min_delay', 'route_max_delay']
        route_stats = route_stats.reset_index()
        
        df = df.merge(route_stats, on='route_id', how='left')
        
        # Z-score for delay within route
        df['delay_z_score'] = (df['delay_minutes'] - df['route_mean_delay']) / df['route_std_delay'].replace(0, 1)
        
        # Time-based statistics
        time_stats = df.groupby(['hour_of_day', 'day_of_week']).agg({
            'delay_minutes': ['mean', 'std']
        }).round(2)
        
        time_stats.columns = ['time_mean_delay', 'time_std_delay']
        time_stats = time_stats.reset_index()
        
        df = df.merge(time_stats, on=['hour_of_day', 'day_of_week'], how='left')
        
        # Time-based Z-score
        df['time_delay_z_score'] = (df['delay_minutes'] - df['time_mean_delay']) / df['time_std_delay'].replace(0, 1)
        
        return df


# Global feature engineer instance
feature_engineer = FeatureEngineer()
