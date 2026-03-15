from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging
import pandas as pd

from models.schemas import ModelTrainingRequest, ModelTrainingResponse
from services.delay_predictor import delay_predictor
from services.anomaly_detector import anomaly_detector
from services.stats_service import stats_service
from utils.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/train", tags=["training"])


@router.post("/model", response_model=ModelTrainingResponse)
async def train_delay_model(
    request: ModelTrainingRequest = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    session: AsyncSession = Depends(get_db)
):
    """
    Train or retrain the delay prediction model
    """
    try:
        if request is None:
            request = ModelTrainingRequest()
        
        # Get training data
        training_data = await _get_training_data(session, request.min_samples)
        
        if len(training_data) < request.min_samples:
            return ModelTrainingResponse(
                success=False,
                model_version="",
                training_samples=len(training_data),
                message=f"Insufficient training data. Need at least {request.min_samples} samples, got {len(training_data)}"
            )
        
        # Train delay prediction model
        start_time = datetime.now()
        delay_result = delay_predictor.train(training_data)
        training_time = (datetime.now() - start_time).total_seconds()
        
        if not delay_result['success']:
            return ModelTrainingResponse(
                success=False,
                model_version="",
                training_samples=len(training_data),
                training_time_seconds=training_time,
                message=delay_result['message']
            )
        
        # Train anomaly detection model
        anomaly_result = anomaly_detector.train(training_data)
        
        # Clear stats cache
        stats_service.clear_cache()
        
        response = ModelTrainingResponse(
            success=True,
            model_version=delay_result['model_version'],
            training_samples=len(training_data),
            accuracy_score=delay_result.get('accuracy_score'),
            mean_squared_error=delay_result.get('mean_squared_error'),
            training_time_seconds=training_time,
            message=f"Model training completed successfully. Anomaly model: {anomaly_result['success']}"
        )
        
        logger.info(f"Model training completed: {delay_result['model_version']}, samples: {len(training_data)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/anomaly-model")
async def train_anomaly_model(
    min_samples: int = 500,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    session: AsyncSession = Depends(get_db)
):
    """
    Train or retrain the anomaly detection model
    """
    try:
        # Get training data
        training_data = await _get_training_data(session, min_samples)
        
        if len(training_data) < min_samples:
            return {
                'success': False,
                'message': f'Insufficient training data. Need at least {min_samples} samples, got {len(training_data)}'
            }
        
        # Train anomaly detection model
        start_time = datetime.now()
        result = anomaly_detector.train(training_data)
        training_time = (datetime.now() - start_time).total_seconds()
        
        if not result['success']:
            return {
                'success': False,
                'training_time_seconds': training_time,
                'message': result['message']
            }
        
        # Clear stats cache
        stats_service.clear_cache()
        
        response = {
            'success': True,
            'training_samples': len(training_data),
            'feature_count': result['feature_count'],
            'contamination': result['contamination'],
            'training_time_seconds': training_time,
            'message': 'Anomaly detection model trained successfully'
        }
        
        logger.info(f"Anomaly model training completed: {len(training_data)} samples")
        
        return response
        
    except Exception as e:
        logger.error(f"Error training anomaly model: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/status")
async def get_training_status():
    """
    Get current training status and model information
    """
    try:
        delay_status = {
            'is_trained': delay_predictor.is_trained,
            'model_type': delay_predictor.model_type,
            'last_training_date': delay_predictor.last_training_date,
            'feature_count': len(delay_predictor.feature_columns),
            'model_path': delay_predictor.model_path
        }
        
        anomaly_status = {
            'is_trained': anomaly_detector.is_trained,
            'feature_count': len(anomaly_detector.feature_columns),
            'model_path': anomaly_detector.model_path
        }
        
        return {
            'delay_predictor': delay_status,
            'anomaly_detector': anomaly_status,
            'overall_status': 'trained' if (delay_predictor.is_trained and anomaly_detector.is_trained) else 'partial' if (delay_predictor.is_trained or anomaly_detector.is_trained) else 'not_trained'
        }
        
    except Exception as e:
        logger.error(f"Error getting training status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/data-quality")
async def get_data_quality_report(
    session: AsyncSession = Depends(get_db)
):
    """
    Get data quality report for training data
    """
    try:
        # Get basic data statistics
        data_query = text("""
            SELECT 
                COUNT(*) as total_trips,
                COUNT(CASE WHEN delay_minutes IS NOT NULL THEN 1 END) as trips_with_delay,
                COUNT(CASE WHEN route_id IS NOT NULL THEN 1 END) as trips_with_route,
                COUNT(CASE WHEN started_at IS NOT NULL THEN 1 END) as trips_with_timestamp,
                MIN(started_at) as earliest_trip,
                MAX(started_at) as latest_trip,
                COUNT(DISTINCT route_id) as unique_routes,
                COUNT(DISTINCT bus_id) as unique_buses
            FROM trips
            WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
        """)
        
        result = await session.execute(data_query)
        data_stats = result.fetchone()
        
        # Get delay statistics
        delay_query = text("""
            SELECT 
                AVG(delay_minutes) as avg_delay,
                MIN(delay_minutes) as min_delay,
                MAX(delay_minutes) as max_delay,
                STDDEV(delay_minutes) as std_delay,
                COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) as on_time_trips,
                COUNT(CASE WHEN delay_minutes > 60 THEN 1 END) as extreme_delays
            FROM trips
            WHERE delay_minutes IS NOT NULL
                AND started_at >= CURRENT_DATE - INTERVAL '90 days'
        """)
        
        delay_result = await session.execute(delay_query)
        delay_stats = delay_result.fetchone()
        
        # Calculate quality metrics
        total_trips = data_stats.total_trips
        delay_completeness = (data_stats.trips_with_delay / total_trips) * 100 if total_trips > 0 else 0
        route_completeness = (data_stats.trips_with_route / total_trips) * 100 if total_trips > 0 else 0
        timestamp_completeness = (data_stats.trips_with_timestamp / total_trips) * 100 if total_trips > 0 else 0
        
        on_time_percentage = (delay_stats.on_time_trips / data_stats.trips_with_delay) * 100 if data_stats.trips_with_delay > 0 else 0
        extreme_delay_percentage = (delay_stats.extreme_delays / data_stats.trips_with_delay) * 100 if data_stats.trips_with_delay > 0 else 0
        
        quality_score = (delay_completeness + route_completeness + timestamp_completeness) / 3
        
        return {
            'data_summary': {
                'total_trips': total_trips,
                'unique_routes': data_stats.unique_routes,
                'unique_buses': data_stats.unique_buses,
                'date_range': {
                    'earliest': data_stats.earliest_trip,
                    'latest': data_stats.latest_trip
                }
            },
            'data_quality': {
                'delay_completeness': delay_completeness,
                'route_completeness': route_completeness,
                'timestamp_completeness': timestamp_completeness,
                'overall_quality_score': quality_score
            },
            'delay_statistics': {
                'average_delay': float(delay_stats.avg_delay) if delay_stats.avg_delay else 0.0,
                'min_delay': float(delay_stats.min_delay) if delay_stats.min_delay else 0.0,
                'max_delay': float(delay_stats.max_delay) if delay_stats.max_delay else 0.0,
                'std_delay': float(delay_stats.std_delay) if delay_stats.std_delay else 0.0,
                'on_time_percentage': on_time_percentage,
                'extreme_delay_percentage': extreme_delay_percentage
            },
            'recommendations': _generate_data_quality_recommendations(quality_score, delay_completeness, on_time_percentage)
        }
        
    except Exception as e:
        logger.error(f"Error generating data quality report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def _get_training_data(session: AsyncSession, min_samples: int) -> pd.DataFrame:
    """Get training data from database"""
    try:
        # Get comprehensive training data
        query = text("""
            SELECT 
                t.id, t.route_id, t.bus_id, t.driver_id, t.started_at, t.scheduled_start,
                t.delay_minutes, t.passenger_count, t.status,
                r.route_code, r.name as route_name, r.total_stops, r.distance_km,
                b.plate_number, b.capacity, b.model,
                u.full_name as driver_name
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            LEFT JOIN users u ON t.driver_id = u.id
            WHERE t.delay_minutes IS NOT NULL
                AND t.started_at >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY t.started_at DESC
            LIMIT 10000
        """)
        
        result = await session.execute(query)
        trips_data = result.fetchall()
        
        if not trips_data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'id': trip.id,
            'route_id': trip.route_id,
            'route_code': trip.route_code,
            'route_name': trip.route_name,
            'bus_id': trip.bus_id,
            'driver_id': trip.driver_id,
            'started_at': trip.started_at,
            'scheduled_start': trip.scheduled_start,
            'delay_minutes': trip.delay_minutes,
            'passenger_count': trip.passenger_count,
            'status': trip.status,
            'total_stops': trip.total_stops,
            'distance_km': trip.distance_km,
            'bus_capacity': trip.capacity,
            'driver_name': trip.driver_name
        } for trip in trips_data])
        
        return df
        
    except Exception as e:
        logger.error(f"Error getting training data: {e}")
        return pd.DataFrame()


def _generate_data_quality_recommendations(quality_score: float, delay_completeness: float, on_time_percentage: float) -> list:
    """Generate data quality recommendations"""
    recommendations = []
    
    if quality_score < 80:
        recommendations.append("Improve data completeness by ensuring all required fields are populated")
    
    if delay_completeness < 90:
        recommendations.append("Ensure delay data is recorded for all trips")
    
    if on_time_percentage < 70:
        recommendations.append("Investigate causes of low punctuality and implement corrective measures")
    
    if quality_score >= 90:
        recommendations.append("Data quality is excellent - suitable for advanced ML models")
    elif quality_score >= 80:
        recommendations.append("Data quality is good - suitable for basic ML models")
    else:
        recommendations.append("Data quality needs improvement before training advanced models")
    
    return recommendations
