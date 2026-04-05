import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch
import tempfile
import os
import json

from services.delay_predictor import DelayPredictor
from services.anomaly_detector import AnomalyDetector


class TestDelayPredictor:
    """Test suite for Delay Prediction Model"""
    
    @pytest.fixture
    def delay_predictor(self):
        """Create delay predictor instance for testing"""
        return DelayPredictor()
    
    @pytest.fixture
    def sample_training_data(self):
        """Generate sample training data"""
        np.random.seed(42)
        return pd.DataFrame({
            'route_id': np.random.choice(['R001', 'R002', 'R003'], 1000),
            'hour': np.random.randint(0, 24, 1000),
            'day_of_week': np.random.randint(0, 7, 1000),
            'month': np.random.randint(1, 13, 1000),
            'is_peak_hour': np.random.choice([0, 1], 1000),
            'distance_km': np.random.uniform(5, 25, 1000),
            'passenger_count': np.random.randint(10, 80, 1000),
            'delay_minutes': np.random.exponential(5, 1000)
        })
    
    def test_initialization(self, delay_predictor):
        """Test delay predictor initialization"""
        assert delay_predictor.model_type == "random_forest"
        assert delay_predictor.is_trained == False
        assert delay_predictor.feature_columns == []
        assert delay_predictor.model_path == "models/ml_models"
    
    def test_feature_engineering(self, delay_predictor, sample_training_data):
        """Test feature engineering"""
        features = delay_predictor._engineer_features(sample_training_data)
        
        assert isinstance(features, pd.DataFrame)
        assert len(features) == len(sample_training_data)
        
        # Check if expected features are created
        expected_features = [
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos',
            'month_sin', 'month_cos', 'is_weekend'
        ]
        for feature in expected_features:
            assert feature in features.columns
    
    def test_training(self, delay_predictor, sample_training_data):
        """Test model training"""
        result = delay_predictor.train(sample_training_data)
        
        assert result['success'] == True
        assert 'model_version' in result
        assert 'training_samples' in result
        assert result['training_samples'] == len(sample_training_data)
        assert delay_predictor.is_trained == True
        assert delay_predictor.feature_columns is not None
        assert len(delay_predictor.feature_columns) > 0
    
    def test_prediction_before_training(self, delay_predictor):
        """Test prediction fails when model not trained"""
        with pytest.raises(ValueError, match="Model not trained"):
            delay_predictor.predict({
                'route_id': 'R001',
                'hour': 14,
                'day_of_week': 2,
                'month': 6,
                'is_peak_hour': 1,
                'distance_km': 12.5,
                'passenger_count': 45
            })
    
    def test_prediction_after_training(self, delay_predictor, sample_training_data):
        """Test prediction after training"""
        # Train the model first
        delay_predictor.train(sample_training_data)
        
        # Test single prediction
        prediction = delay_predictor.predict({
            'route_id': 'R001',
            'hour': 14,
            'day_of_week': 2,
            'month': 6,
            'is_peak_hour': 1,
            'distance_km': 12.5,
            'passenger_count': 45
        })
        
        assert isinstance(prediction, dict)
        assert 'predicted_delay' in prediction
        assert 'confidence' in prediction
        assert prediction['predicted_delay'] >= 0
        assert 0 <= prediction['confidence'] <= 1
        
        # Test batch prediction
        batch_data = [
            {
                'route_id': 'R001',
                'hour': 14,
                'day_of_week': 2,
                'month': 6,
                'is_peak_hour': 1,
                'distance_km': 12.5,
                'passenger_count': 45
            },
            {
                'route_id': 'R002',
                'hour': 8,
                'day_of_week': 1,
                'month': 6,
                'is_peak_hour': 0,
                'distance_km': 15.2,
                'passenger_count': 30
            }
        ]
        
        batch_predictions = delay_predictor.predict_batch(batch_data)
        assert len(batch_predictions) == len(batch_data)
        for pred in batch_predictions:
            assert 'predicted_delay' in pred
            assert 'confidence' in pred
    
    def test_model_saving_loading(self, delay_predictor, sample_training_data):
        """Test model saving and loading"""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_model_path = os.path.join(temp_dir, "test_model")
            delay_predictor.model_path = temp_model_path
            
            # Train and save model
            delay_predictor.train(sample_training_data)
            delay_predictor.save_model()
            
            # Check if model files exist
            assert os.path.exists(os.path.join(temp_model_path, "delay_predictor.pkl"))
            assert os.path.exists(os.path.join(temp_model_path, "model_metadata.json"))
            
            # Create new instance and load model
            new_predictor = DelayPredictor()
            new_predictor.model_path = temp_model_path
            new_predictor.load_model()
            
            assert new_predictor.is_trained == True
            assert new_predictor.feature_columns == delay_predictor.feature_columns
            
            # Test prediction with loaded model
            prediction = new_predictor.predict({
                'route_id': 'R001',
                'hour': 14,
                'day_of_week': 2,
                'month': 6,
                'is_peak_hour': 1,
                'distance_km': 12.5,
                'passenger_count': 45
            })
            
            assert 'predicted_delay' in prediction
    
    def test_insufficient_training_data(self, delay_predictor):
        """Test behavior with insufficient training data"""
        insufficient_data = pd.DataFrame({
            'route_id': ['R001'],
            'hour': [14],
            'day_of_week': [2],
            'month': [6],
            'is_peak_hour': [1],
            'distance_km': [12.5],
            'passenger_count': [45],
            'delay_minutes': [5]
        })
        
        result = delay_predictor.train(insufficient_data)
        assert result['success'] == False
        assert 'error' in result
        assert delay_predictor.is_trained == False


class TestAnomalyDetector:
    """Test suite for Anomaly Detection Model"""
    
    @pytest.fixture
    def anomaly_detector(self):
        """Create anomaly detector instance for testing"""
        return AnomalyDetector()
    
    @pytest.fixture
    def sample_anomaly_data(self):
        """Generate sample data with anomalies"""
        np.random.seed(42)
        normal_data = np.random.normal(0, 1, 950)
        anomalies = np.random.normal(5, 2, 50)  # Add some anomalies
        data = np.concatenate([normal_data, anomalies])
        
        return pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=1000, freq='H'),
            'route_id': np.random.choice(['R001', 'R002', 'R003'], 1000),
            'delay_minutes': data,
            'passenger_count': np.random.randint(10, 80, 1000),
            'gps_speed': np.random.uniform(0, 60, 1000),
            'gps_accuracy': np.random.uniform(1, 10, 1000)
        })
    
    def test_initialization(self, anomaly_detector):
        """Test anomaly detector initialization"""
        assert anomaly_detector.model_type == "isolation_forest"
        assert anomaly_detector.is_trained == False
        assert anomaly_detector.model_path == "models/ml_models"
    
    def test_training(self, anomaly_detector, sample_anomaly_data):
        """Test anomaly detector training"""
        result = anomaly_detector.train(sample_anomaly_data)
        
        assert result['success'] == True
        assert 'model_version' in result
        assert 'training_samples' in result
        assert result['training_samples'] == len(sample_anomaly_data)
        assert anomaly_detector.is_trained == True
    
    def test_anomaly_detection(self, anomaly_detector, sample_anomaly_data):
        """Test anomaly detection"""
        # Train the model first
        anomaly_detector.train(sample_anomaly_data)
        
        # Test single data point
        test_point = {
            'timestamp': '2024-01-01 12:00:00',
            'route_id': 'R001',
            'delay_minutes': 15.5,  # Potential anomaly
            'passenger_count': 45,
            'gps_speed': 25.0,
            'gps_accuracy': 5.0
        }
        
        result = anomaly_detector.detect_anomaly(test_point)
        
        assert isinstance(result, dict)
        assert 'is_anomaly' in result
        assert 'anomaly_score' in result
        assert 'confidence' in result
        assert isinstance(result['is_anomaly'], bool)
        assert 0 <= result['anomaly_score'] <= 1
        assert 0 <= result['confidence'] <= 1
        
        # Test batch detection
        batch_data = [test_point] * 5
        batch_results = anomaly_detector.detect_anomaly_batch(batch_data)
        assert len(batch_results) == len(batch_data)
        
        for res in batch_results:
            assert 'is_anomaly' in res
            assert 'anomaly_score' in res
    
    def test_model_persistence(self, anomaly_detector, sample_anomaly_data):
        """Test model saving and loading"""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_model_path = os.path.join(temp_dir, "test_anomaly_model")
            anomaly_detector.model_path = temp_model_path
            
            # Train and save model
            anomaly_detector.train(sample_anomaly_data)
            anomaly_detector.save_model()
            
            # Check if model files exist
            assert os.path.exists(os.path.join(temp_model_path, "anomaly_detector.pkl"))
            assert os.path.exists(os.path.join(temp_model_path, "anomaly_metadata.json"))
            
            # Create new instance and load model
            new_detector = AnomalyDetector()
            new_detector.model_path = temp_model_path
            new_detector.load_model()
            
            assert new_detector.is_trained == True
            
            # Test anomaly detection with loaded model
            test_point = {
                'timestamp': '2024-01-01 12:00:00',
                'route_id': 'R001',
                'delay_minutes': 15.5,
                'passenger_count': 45,
                'gps_speed': 25.0,
                'gps_accuracy': 5.0
            }
            
            result = new_detector.detect_anomaly(test_point)
            assert 'is_anomaly' in result
    
    def test_edge_cases(self, anomaly_detector, sample_anomaly_data):
        """Test edge cases and error handling"""
        # Train the model first
        anomaly_detector.train(sample_anomaly_data)
        
        # Test with missing required fields
        incomplete_data = {
            'route_id': 'R001',
            'delay_minutes': 5.0
            # Missing other required fields
        }
        
        # Should handle missing data gracefully
        result = anomaly_detector.detect_anomaly(incomplete_data)
        assert isinstance(result, dict)
        assert 'error' in result or 'is_anomaly' in result
        
        # Test with invalid data types
        invalid_data = {
            'timestamp': 'invalid-date',
            'route_id': 'R001',
            'delay_minutes': 'not-a-number',
            'passenger_count': 45,
            'gps_speed': 25.0,
            'gps_accuracy': 5.0
        }
        
        result = anomaly_detector.detect_anomaly(invalid_data)
        assert isinstance(result, dict)
        assert 'error' in result


class TestModelIntegration:
    """Integration tests for ML models working together"""
    
    def test_delay_and_anomaly_integration(self):
        """Test delay predictor and anomaly detector working together"""
        delay_predictor = DelayPredictor()
        anomaly_detector = AnomalyDetector()
        
        # Generate integrated test data
        np.random.seed(42)
        integrated_data = pd.DataFrame({
            'route_id': np.random.choice(['R001', 'R002'], 100),
            'hour': np.random.randint(0, 24, 100),
            'day_of_week': np.random.randint(0, 7, 100),
            'month': np.random.randint(1, 13, 100),
            'is_peak_hour': np.random.choice([0, 1], 100),
            'distance_km': np.random.uniform(5, 25, 100),
            'passenger_count': np.random.randint(10, 80, 100),
            'delay_minutes': np.random.exponential(5, 100),
            'timestamp': pd.date_range('2024-01-01', periods=100, freq='H'),
            'gps_speed': np.random.uniform(0, 60, 100),
            'gps_accuracy': np.random.uniform(1, 10, 100)
        })
        
        # Train both models
        delay_result = delay_predictor.train(integrated_data)
        anomaly_result = anomaly_detector.train(integrated_data)
        
        assert delay_result['success'] == True
        assert anomaly_result['success'] == True
        
        # Test integrated prediction
        test_input = {
            'route_id': 'R001',
            'hour': 14,
            'day_of_week': 2,
            'month': 6,
            'is_peak_hour': 1,
            'distance_km': 12.5,
            'passenger_count': 45,
            'timestamp': '2024-01-01 12:00:00',
            'gps_speed': 25.0,
            'gps_accuracy': 5.0
        }
        
        delay_pred = delay_predictor.predict(test_input)
        anomaly_pred = anomaly_detector.detect_anomaly(test_input)
        
        # Both should return valid predictions
        assert 'predicted_delay' in delay_pred
        assert 'is_anomaly' in anomaly_pred
        
        # Test consistency - high delay should correlate with anomaly detection
        if delay_pred['predicted_delay'] > 20:  # Very high delay
            # Should be more likely to be detected as anomaly
            assert anomaly_pred['anomaly_score'] > 0.5
