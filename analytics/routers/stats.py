from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
import logging

from utils.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)
router = APIRouter(tags=["stats"])


@router.get("/delays")
async def get_delays(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    route_id: Optional[str] = Query(None, description="Filter by specific route"),
    session: AsyncSession = Depends(get_db)
):
    """Get delay statistics by route and hour"""
    try:
        conditions = ["t.started_at >= CURRENT_DATE - INTERVAL '{days} days'"]
        params = {"days": days}
        
        if route_id:
            conditions.append("t.route_id = :route_id")
            params["route_id"] = route_id
        
        where_clause = " AND ".join(conditions)
        
        query = text(f"""
            SELECT t.route_id, r.id, r.name, r.route_code, r.color,
                   DATE_TRUNC('hour', t.started_at) as hour_bucket,
                   COUNT(*) as trip_count,
                   AVG(t.delay_minutes) as avg_delay,
                   MAX(t.delay_minutes) as max_delay,
                   CASE 
                     WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN t.delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(*)
                     ELSE 0 
                   END as on_time_pct
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            WHERE t.started_at >= CURRENT_DATE - INTERVAL '{days} days'
              AND t.delay_minutes IS NOT NULL
            GROUP BY t.route_id, r.id, r.name, r.route_code, r.color, DATE_TRUNC('hour', t.started_at)
            ORDER BY hour_bucket DESC
            LIMIT 200
        """)
        
        result = await session.execute(query, params)
        rows = result.fetchall()
        
        delays = []
        for row in rows:
            delays.append({
                "route": {
                    "id": row.id,
                    "name": row.name,
                    "route_code": row.route_code,
                    "color": row.color
                },
                "hour_bucket": row.hour_bucket.isoformat() if row.hour_bucket else None,
                "trip_count": row.trip_count,
                "averageDelay": float(row.avg_delay) if row.avg_delay else 0.0,
                "maxDelay": float(row.max_delay) if row.max_delay else 0.0,
                "onTimePercentage": float(row.on_time_pct) if row.on_time_pct else 0.0
            })
        
        return delays
        
    except Exception as e:
        logger.error(f"Error getting delays: {e}")
        raise HTTPException(status_code=500, detail="Failed to get delays")


@router.get("/peak-hours")
async def get_peak_hours(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    session: AsyncSession = Depends(get_db)
):
    """Get peak hours analysis"""
    try:
        query = text(f"""
            SELECT EXTRACT(HOUR FROM started_at)::int as hour,
                   COUNT(*) as trip_count,
                   AVG(delay_minutes) as avg_delay,
                   CASE 
                     WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(*)
                     ELSE 0 
                   END as on_time_pct,
                   SUM(passenger_count) as passenger_count
            FROM trips
            WHERE started_at >= CURRENT_DATE - INTERVAL '{days} days'
              AND delay_minutes IS NOT NULL
            GROUP BY EXTRACT(HOUR FROM started_at)
            ORDER BY hour
        """)
        
        result = await session.execute(query)
        rows = result.fetchall()
        
        peak_hours = []
        for row in rows:
            peak_hours.append({
                "hour": row.hour,
                "tripCount": row.trip_count,
                "averageDelay": float(row.avg_delay) if row.avg_delay else 0.0,
                "onTimePercentage": float(row.on_time_pct) if row.on_time_pct else 0.0,
                "passengerCount": row.passenger_count or 0
            })
        
        return peak_hours
        
    except Exception as e:
        logger.error(f"Error getting peak hours: {e}")
        raise HTTPException(status_code=500, detail="Failed to get peak hours")


@router.get("/routes/problematic")
async def get_problematic_routes(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    limit: int = Query(10, ge=1, le=50, description="Number of routes to return"),
    session: AsyncSession = Depends(get_db)
):
    """Get most problematic routes by delay"""
    try:
        query = text(f"""
            SELECT r.id, r.route_code, r.name, r.color,
                   COUNT(t.id) as total_trips,
                   AVG(t.delay_minutes) as avg_delay,
                   CASE 
                     WHEN COUNT(t.id) > 0 THEN COUNT(CASE WHEN t.delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(t.id)
                     ELSE 100.0
                   END as on_time_pct,
                   MAX(t.delay_minutes) as max_delay
            FROM routes r
            LEFT JOIN trips t ON r.id = t.route_id
              AND t.started_at >= CURRENT_DATE - INTERVAL '{days} days'
            WHERE r.status = 'active'
            GROUP BY r.id, r.route_code, r.name, r.color
            ORDER BY avg_delay DESC NULLS LAST
            LIMIT :limit
        """)
        
        result = await session.execute(query, {"limit": limit})
        rows = result.fetchall()
        
        routes = []
        for row in rows:
            routes.append({
                "id": row.id,
                "routeCode": row.route_code,
                "name": row.name,
                "color": row.color,
                "totalTrips": row.total_trips or 0,
                "averageDelay": float(row.avg_delay) if row.avg_delay else 0.0,
                "onTimePercentage": float(row.on_time_pct) if row.on_time_pct and row.total_trips > 0 else 100.0,
                "maxDelay": float(row.max_delay) if row.max_delay else 0.0
            })
        
        return routes
        
    except Exception as e:
        logger.error(f"Error getting problematic routes: {e}")
        raise HTTPException(status_code=500, detail="Failed to get problematic routes")


@router.get("/heatmap")
async def get_heatmap(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    session: AsyncSession = Depends(get_db)
):
    """Get heatmap data for delays by location"""
    try:
        query = text(f"""
            SELECT s.lat, s.lng, AVG(t.delay_minutes) as weight, r.route_code
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN route_stations rs ON rs.route_id = r.id
            JOIN stations s ON rs.station_id = s.id
            WHERE t.started_at >= CURRENT_DATE - INTERVAL '{days} days'
              AND t.delay_minutes IS NOT NULL
              AND s.lat IS NOT NULL
              AND s.lng IS NOT NULL
            GROUP BY s.lat, s.lng, r.route_code
            LIMIT 500
        """)
        
        result = await session.execute(query)
        rows = result.fetchall()
        
        heatmap = []
        for row in rows:
            heatmap.append({
                "lat": float(row.lat),
                "lng": float(row.lng),
                "weight": float(row.weight) if row.weight else 0.0,
                "routeCode": row.route_code
            })
        
        return heatmap
        
    except Exception as e:
        logger.error(f"Error getting heatmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to get heatmap")
