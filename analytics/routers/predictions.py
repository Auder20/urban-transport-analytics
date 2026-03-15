from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
import logging
import pandas as pd

from models.schemas import RouteAnalysis, AnomalyDetection
from services.delay_predictor import delay_predictor
from services.anomaly_detector import anomaly_detector
from utils.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.get("/route/{route_id}/summary", response_model=RouteAnalysis)
async def get_route_analysis(
    route_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    session: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive analysis for a specific route
    """
    try:
        # Validate route exists and get basic info
        route_query = text("""
            SELECT id, route_code, name, color, total_stops, distance_km
            FROM routes 
            WHERE id = :route_id AND status = 'active'
        """)
        result = await session.execute(route_query, {"route_id": route_id})
        route = result.fetchone()
        
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        # Get trip data for analysis
        trips_query = text("""
            SELECT 
                id, started_at, scheduled_start, delay_minutes, 
                passenger_count, status
            FROM trips 
            WHERE route_id = :route_id 
                AND started_at >= CURRENT_DATE - INTERVAL ':days days'
                AND delay_minutes IS NOT NULL
            ORDER BY started_at DESC
        """)
        
        trips_result = await session.execute(trips_query, {"route_id": route_id, "days": days})
        trips_data = trips_result.fetchall()
        
        if not trips_data:
            return RouteAnalysis(
                route_id=route_id,
                route_code=route.route_code,
                route_name=route.name,
                total_trips=0,
                average_delay=0.0,
                max_delay=0.0,
                min_delay=0.0,
                delay_std=0.0,
                on_time_percentage=0.0,
                peak_hours=[],
                problematic_stops=[],
                recommendations=["No data available for analysis"]
            )
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame([{
            'id': trip.id,
            'started_at': trip.started_at,
            'scheduled_start': trip.scheduled_start,
            'delay_minutes': trip.delay_minutes,
            'passenger_count': trip.passenger_count,
            'status': trip.status
        } for trip in trips_data])
        
        # Calculate statistics
        delays = df['delay_minutes']
        total_trips = len(df)
        average_delay = delays.mean()
        max_delay = delays.max()
        min_delay = delays.min()
        delay_std = delays.std()
        on_time_trips = (delays <= 5).sum()
        on_time_percentage = (on_time_trips / total_trips) * 100
        
        # Find peak hours (hours with highest average delays)
        df['hour'] = pd.to_datetime(df['started_at']).dt.hour
        hourly_delays = df.groupby('hour')['delay_minutes'].mean().sort_values(ascending=False)
        peak_hours = hourly_delays.head(3).index.tolist()
        
        # Get problematic stops (stations with most delays on this route)
        stops_query = text("""
            SELECT s.name, COUNT(t.id) as delayed_trips
            FROM stations s
            JOIN route_stations rs ON s.id = rs.station_id
            JOIN trips t ON t.route_id = rs.route_id
            WHERE rs.route_id = :route_id 
                AND t.delay_minutes > 15
                AND t.started_at >= CURRENT_DATE - INTERVAL ':days days'
            GROUP BY s.name
            ORDER BY delayed_trips DESC
            LIMIT 5
        """)
        
        stops_result = await session.execute(stops_query, {"route_id": route_id, "days": days})
        problematic_stops = [row.name for row in stops_result.fetchall()]
        
        # Generate recommendations
        recommendations = _generate_recommendations(average_delay, on_time_percentage, peak_hours)
        
        analysis = RouteAnalysis(
            route_id=route_id,
            route_code=route.route_code,
            route_name=route.name,
            total_trips=total_trips,
            average_delay=float(average_delay),
            max_delay=float(max_delay),
            min_delay=float(min_delay),
            delay_std=float(delay_std),
            on_time_percentage=float(on_time_percentage),
            peak_hours=peak_hours,
            problematic_stops=problematic_stops,
            recommendations=recommendations
        )
        
        logger.info(f"Route analysis completed for {route.route_code}: {total_trips} trips analyzed")
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing route: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/anomalies", response_model=List[AnomalyDetection])
async def get_anomalies(
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    route_id: Optional[str] = Query(None, description="Filter by specific route"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    session: AsyncSession = Depends(get_db)
):
    """
    Get detected anomalies in trip data
    """
    try:
        # Build query conditions
        conditions = ["started_at >= CURRENT_DATE - INTERVAL ':days days'"]
        params = {"days": days}
        
        if route_id:
            conditions.append("route_id = :route_id")
            params["route_id"] = route_id
        
        where_clause = " AND ".join(conditions)
        
        # Get trip data for anomaly detection
        trips_query = text(f"""
            SELECT 
                t.id, t.route_id, t.started_at, t.delay_minutes,
                r.route_code, r.name as route_name
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            WHERE {where_clause}
                AND t.delay_minutes IS NOT NULL
            ORDER BY t.started_at DESC
        """)
        
        trips_result = await session.execute(trips_query, params)
        trips_data = trips_result.fetchall()
        
        if not trips_data:
            return []
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'id': trip.id,
            'route_id': trip.route_id,
            'route_code': trip.route_code,
            'route_name': trip.route_name,
            'started_at': trip.started_at,
            'delay_minutes': trip.delay_minutes
        } for trip in trips_data])
        
        # Detect anomalies
        anomalies = anomaly_detector.detect_anomalies(df)
        
        # Filter by severity if specified
        if severity:
            anomalies = [a for a in anomalies if a['severity'] == severity]
        
        # Convert to response models
        anomaly_responses = [
            AnomalyDetection(**anomaly) for anomaly in anomalies
        ]
        
        logger.info(f"Detected {len(anomaly_responses)} anomalies in {len(trips_data)} trips")
        
        return anomaly_responses
        
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/delays/hourly")
async def get_hourly_delay_analysis(
    route_id: Optional[str] = Query(None, description="Filter by specific route"),
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    session: AsyncSession = Depends(get_db)
):
    """
    Get hourly delay analysis
    """
    try:
        # Build query conditions
        conditions = ["started_at >= CURRENT_DATE - INTERVAL ':days days'"]
        params = {"days": days}
        
        if route_id:
            conditions.append("t.route_id = :route_id")
            params["route_id"] = route_id
        
        where_clause = " AND ".join(conditions)
        
        # Get hourly delay statistics
        hourly_query = text(f"""
            SELECT 
                EXTRACT(HOUR FROM t.started_at) as hour,
                COUNT(*) as trip_count,
                AVG(t.delay_minutes) as avg_delay,
                MAX(t.delay_minutes) as max_delay,
                COUNT(CASE WHEN t.delay_minutes > 15 THEN 1 END) as problematic_trips,
                COUNT(CASE WHEN t.delay_minutes <= 5 THEN 1 END) as on_time_trips
            FROM trips t
            WHERE {where_clause}
                AND t.delay_minutes IS NOT NULL
            GROUP BY EXTRACT(HOUR FROM t.started_at)
            ORDER BY hour
        """)
        
        hourly_result = await session.execute(hourly_query, params)
        hourly_data = hourly_result.fetchall()
        
        hourly_analysis = []
        for row in hourly_data:
            on_time_percentage = (row.on_time_trips / row.trip_count) * 100 if row.trip_count > 0 else 0
            
            hourly_analysis.append({
                'hour': int(row.hour),
                'trip_count': row.trip_count,
                'average_delay': float(row.avg_delay) if row.avg_delay else 0.0,
                'max_delay': float(row.max_delay) if row.max_delay else 0.0,
                'problematic_trips': row.problematic_trips,
                'on_time_trips': row.on_time_trips,
                'on_time_percentage': float(on_time_percentage)
            })
        
        return {
            'route_id': route_id,
            'days': days,
            'hourly_analysis': hourly_analysis,
            'summary': {
                'total_hours': len(hourly_analysis),
                'worst_hour': max(hourly_analysis, key=lambda x: x['average_delay'])['hour'] if hourly_analysis else None,
                'best_hour': min(hourly_analysis, key=lambda x: x['average_delay'])['hour'] if hourly_analysis else None,
                'peak_performance': [h for h in hourly_analysis if h['hour'] in [7, 8, 17, 18]]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting hourly delay analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def _generate_recommendations(average_delay: float, on_time_percentage: float, peak_hours: List[int]) -> List[str]:
    """Generate recommendations based on analysis"""
    recommendations = []
    
    if average_delay > 15:
        recommendations.append("Consider increasing bus frequency during peak hours")
        recommendations.append("Review traffic patterns and consider alternative routes")
    
    if on_time_percentage < 80:
        recommendations.append("Implement real-time tracking and passenger information systems")
        recommendations.append("Consider dedicated bus lanes to improve punctuality")
    
    if peak_hours:
        peak_hour_str = ", ".join([f"{h}:00" for h in peak_hours])
        recommendations.append(f"Peak hours identified at {peak_hour_str} - allocate additional resources")
    
    if average_delay < 5 and on_time_percentage > 90:
        recommendations.append("Excellent performance - maintain current service levels")
    
    if not recommendations:
        recommendations.append("Continue monitoring performance and optimize as needed")
    
    return recommendations
