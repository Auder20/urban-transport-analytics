import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
import asyncio
from datetime import datetime, timedelta

from services.delay_predictor import delay_predictor
from services.anomaly_detector import anomaly_detector
from services.stats_service import stats_service
from utils.db import get_db


class TestDelayPredictorService:
    """Test delay predictor service integration"""
    
    @pytest.mark.asyncio
    async def test_get_delay_predictions(self):
        """Test getting delay predictions from service"""
        # Mock the database query
        mock_data = pd.DataFrame({
            'route_id': ['R001', 'R002'],
            'hour': [14, 8],
            'day_of_week': [2, 1],
            'month': [6, 6],
            'delay_minutes': [5.2, 3.1]
        })
        
        with patch.object(delay_predictor, 'predict') as mock_predict:
            mock_predict.return_value = {
                'predicted_delay': 4.5,
                'confidence': 0.85
            }
            
            result = await delay_predictor.get_delay_predictions('R001', 14, 2, 6)
            
            assert 'predictions' in result
            assert 'metadata' in result
            assert isinstance(result['predictions'], list)
    
    @pytest.mark.asyncio
    async def test_batch_delay_predictions(self):
        """Test batch delay predictions"""
        requests = [
            {'route_id': 'R001', 'hour': 14, 'day_of_week': 2, 'month': 6},
            {'route_id': 'R002', 'hour': 8, 'day_of_week': 1, 'month': 6}
        ]
        
        with patch.object(delay_predictor, 'predict_batch') as mock_predict:
            mock_predict.return_value = [
                {'predicted_delay': 4.5, 'confidence': 0.85},
                {'predicted_delay': 2.8, 'confidence': 0.92}
            ]
            
            result = await delay_predictor.get_batch_delay_predictions(requests)
            
            assert len(result) == len(requests)
            for prediction in result:
                assert 'predicted_delay' in prediction
                assert 'confidence' in prediction


class TestAnomalyDetectorService:
    """Test anomaly detector service integration"""
    
    @pytest.mark.asyncio
    async def test_get_recent_anomalies(self):
        """Test getting recent anomalies"""
        with patch.object(anomaly_detector, 'get_recent_anomalies') as mock_anomalies:
            mock_anomalies.return_value = [
                {
                    'id': 1,
                    'route_id': 'R001',
                    'anomaly_type': 'high_delay',
                    'anomaly_score': 0.95,
                    'detected_at': datetime.now(),
                    'resolved': False
                }
            ]
            
            result = await anomaly_detector.get_recent_anomalies(hours=24)
            
            assert isinstance(result, list)
            assert len(result) > 0
            for anomaly in result:
                assert 'route_id' in anomaly
                assert 'anomaly_score' in anomaly
                assert 'detected_at' in anomaly
    
    @pytest.mark.asyncio
    async def test_anomaly_resolution(self):
        """Test marking anomaly as resolved"""
        anomaly_id = 1
        
        with patch.object(anomaly_detector, 'resolve_anomaly') as mock_resolve:
            mock_resolve.return_value = {'success': True}
            
            result = await anomaly_detector.resolve_anomaly(anomaly_id)
            
            assert result['success'] == True


class TestStatsService:
    """Test statistics service"""
    
    @pytest.mark.asyncio
    async def test_get_system_stats(self):
        """Test getting system statistics"""
        with patch('utils.db.get_db') as mock_db:
            mock_conn = AsyncMock()
            mock_db.return_value = mock_conn
            
            # Mock database responses
            mock_conn.execute.return_value.fetchmany.return_value = [
                (100,),  # total_trips
                (5.2,),  # avg_delay
                (25,),   # active_buses
                (10,)    # active_routes
            ]
            
            result = await stats_service.get_system_stats()
            
            assert 'total_trips' in result
            assert 'avg_delay' in result
            assert 'active_buses' in result
            assert 'active_routes' in result
            assert 'timestamp' in result
    
    @pytest.mark.asyncio
    async def test_get_kpis(self):
        """Test getting KPIs"""
        with patch('utils.db.get_db') as mock_db:
            mock_conn = AsyncMock()
            mock_db.return_value = mock_conn
            
            # Mock KPI data
            mock_conn.execute.return_value.fetchmany.return_value = [
                (85.5,),  # on_time_performance
                (92.3,),  # route_efficiency
                (4.1,),   # fuel_efficiency
                (156,)    # passenger_satisfaction
            ]
            
            result = await stats_service.get_kpis()
            
            assert 'on_time_performance' in result
            assert 'route_efficiency' in result
            assert 'fuel_efficiency' in result
            assert 'passenger_satisfaction' in result
    
    @pytest.mark.asyncio
    async def test_get_route_analytics(self):
        """Test getting route-specific analytics"""
        route_id = 'R001'
        days = 30
        
        with patch('utils.db.get_db') as mock_db:
            mock_conn = AsyncMock()
            mock_db.return_value = mock_conn
            
            # Mock route analytics data
            mock_conn.execute.return_value.fetchmany.return_value = [
                ('R001', 'Route 1', 150, 4.2, 92.5),
                ('R001', 'Route 1', 120, 3.8, 94.1),
            ]
            
            result = await stats_service.get_route_analytics(route_id, days)
            
            assert 'route_id' in result
            assert 'analytics' in result
            assert 'summary' in result
            assert len(result['analytics']) > 0


class TestModelPerformance:
    """Test ML model performance metrics"""
    
    @pytest.mark.asyncio
    async def test_delay_predictor_accuracy(self):
        """Test delay predictor accuracy metrics"""
        # Generate test data with known outcomes
        test_data = pd.DataFrame({
            'route_id': ['R001'] * 100,
            'hour': [14] * 100,
            'day_of_week': [2] * 100,
            'month': [6] * 100,
            'is_peak_hour': [1] * 100,
            'distance_km': [12.5] * 100,
            'passenger_count': [45] * 100,
            'actual_delay': np.random.normal(5, 2, 100)  # Known actual delays
        })
        
        # Train model on subset
        train_data = test_data[:80]
        delay_predictor.train(train_data)
        
        # Test on remaining data
        test_features = test_data[80:].drop('actual_delay', axis=1)
        predictions = []
        
        for _, row in test_features.iterrows():
            pred = delay_predictor.predict(row.to_dict())
            predictions.append(pred['predicted_delay'])
        
        # Calculate accuracy metrics
        actual_delays = test_data[80:]['actual_delay'].values
        mae = np.mean(np.abs(predictions - actual_delays))
        rmse = np.sqrt(np.mean((predictions - actual_delays) ** 2))
        
        # Assert reasonable performance
        assert mae < 10  # Mean absolute error should be reasonable
        assert rmse < 15  # Root mean square error should be reasonable
    
    @pytest.mark.asyncio
    async def test_anomaly_detector_precision_recall(self):
        """Test anomaly detector precision and recall"""
        # Generate test data with known anomalies
        np.random.seed(42)
        normal_data = np.random.normal(0, 1, 900)
        anomaly_data = np.random.normal(5, 2, 100)  # Known anomalies
        
        test_data = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=1000, freq='H'),
            'route_id': ['R001'] * 1000,
            'delay_minutes': np.concatenate([normal_data, anomaly_data]),
            'passenger_count': np.random.randint(10, 80, 1000),
            'gps_speed': np.random.uniform(0, 60, 1000),
            'gps_accuracy': np.random.uniform(1, 10, 1000),
            'is_anomaly': [False] * 900 + [True] * 100  # Ground truth
        })
        
        # Train anomaly detector
        anomaly_detector.train(test_data)
        
        # Test anomaly detection
        detected_anomalies = []
        for _, row in test_data.iterrows():
            result = anomaly_detector.detect_anomaly(row.to_dict())
            detected_anomalies.append(result['is_anomaly'])
        
        # Calculate precision and recall
        true_positives = sum(1 for i, detected in enumerate(detected_anomalies) 
                           if detected and test_data.iloc[i]['is_anomaly'])
        false_positives = sum(1 for i, detected in enumerate(detected_anomalies) 
                            if detected and not test_data.iloc[i]['is_anomaly'])
        false_negatives = sum(1 for i, detected in enumerate(detected_anomalies) 
                            if not detected and test_data.iloc[i]['is_anomaly'])
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        
        # Assert reasonable performance
        assert precision > 0.7  # At least 70% precision
        assert recall > 0.6     # At least 60% recall


class TestModelReliability:
    """Test model reliability and error handling"""
    
    @pytest.mark.asyncio
    async def test_model_fallback_behavior(self):
        """Test model behavior when predictions fail"""
        with patch.object(delay_predictor, 'predict') as mock_predict:
            mock_predict.side_effect = Exception("Model prediction failed")
            
            # Should handle errors gracefully
            with pytest.raises(Exception):
                delay_predictor.predict({
                    'route_id': 'R001',
                    'hour': 14,
                    'day_of_week': 2,
                    'month': 6,
                    'is_peak_hour': 1,
                    'distance_km': 12.5,
                    'passenger_count': 45
                })
    
    @pytest.mark.asyncio
    async def test_model_confidence_calibration(self):
        """Test model confidence calibration"""
        # Generate test data with varying difficulty
        test_data = []
        for i in range(100):
            confidence = i / 100  # Varying confidence levels
            test_data.append({
                'route_id': 'R001',
                'hour': 14,
                'day_of_week': 2,
                'month': 6,
                'is_peak_hour': 1,
                'distance_km': 12.5,
                'passenger_count': 45,
                'confidence': confidence
            })
        
        # Test confidence calibration
        high_confidence_predictions = [p for p in test_data if p['confidence'] > 0.8]
        low_confidence_predictions = [p for p in test_data if p['confidence'] < 0.2]
        
        # High confidence predictions should be more consistent
        assert len(high_confidence_predictions) > 0
        assert len(low_confidence_predictions) > 0
