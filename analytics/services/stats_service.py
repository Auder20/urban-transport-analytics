import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func
import asyncio

from utils.db import get_db
from models.schemas import SystemStats, KPIS

logger = logging.getLogger(__name__)


class StatsService:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def get_system_stats(self) -> SystemStats:
        """Get comprehensive system statistics"""
        try:
            cache_key = 'system_stats'
            if cache_key in self.cache:
                cached_data, timestamp = self.cache[cache_key]
                if datetime.now().timestamp() - timestamp < self.cache_ttl:
                    return cached_data
            
            async with get_db().__anext__() as session:
                # Get basic counts
                total_trips = await self._get_total_trips(session)
                total_routes = await self._get_total_routes(session)
                total_buses = await self._get_total_buses(session)
                
                # Get delay statistics
                delay_stats = await self._get_delay_stats(session)
                
                # Get model information
                model_info = await self._get_model_info()
                
                stats = SystemStats(
                    total_trips=total_trips,
                    total_routes=total_routes,
                    total_buses=total_buses,
                    average_delay=delay_stats['average_delay'],
                    on_time_percentage=delay_stats['on_time_percentage'],
                    model_accuracy=model_info.get('accuracy'),
                    last_model_update=model_info.get('last_update'),
                    cache_hit_rate=0.85  # Placeholder
                )
                
                # Cache the result
                self.cache[cache_key] = (stats, datetime.now().timestamp())
                
                return stats
                
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            # Return default stats
            return SystemStats(
                total_trips=0,
                total_routes=0,
                total_buses=0,
                average_delay=0.0,
                on_time_percentage=0.0
            )
    
    async def get_kpis(self) -> KPIS:
        """Get key performance indicators"""
        try:
            cache_key = 'kpis'
            if cache_key in self.cache:
                cached_data, timestamp = self.cache[cache_key]
                if datetime.now().timestamp() - timestamp < 120:  # 2 minutes cache
                    return cached_data
            
            async with get_db().__anext__() as session:
                # Get today's statistics
                today_stats = await self._get_today_stats(session)
                
                # Get system health
                system_health = await self._check_system_health()
                
                kpis = KPIS(
                    total_buses=today_stats['total_buses'],
                    active_buses=today_stats['active_buses'],
                    total_routes=today_stats['total_routes'],
                    total_trips_today=today_stats['total_trips_today'],
                    on_time_percentage_today=today_stats['on_time_percentage_today'],
                    average_delay_today=today_stats['average_delay_today'],
                    system_health=system_health,
                    last_updated=datetime.now()
                )
                
                # Cache the result
                self.cache[cache_key] = (kpis, datetime.now().timestamp())
                
                return kpis
                
        except Exception as e:
            logger.error(f"Error getting KPIs: {e}")
            return KPIS(
                total_buses=0,
                active_buses=0,
                total_routes=0,
                total_trips_today=0,
                on_time_percentage_today=0.0,
                average_delay_today=0.0,
                system_health='unknown',
                last_updated=datetime.now()
            )
    
    async def _get_total_trips(self, session: AsyncSession) -> int:
        """Get total number of trips"""
        try:
            result = await session.execute(text("SELECT COUNT(*) as count FROM trips"))
            return result.scalar() or 0
        except Exception as e:
            logger.error(f"Error getting total trips: {e}")
            return 0
    
    async def _get_total_routes(self, session: AsyncSession) -> int:
        """Get total number of active routes"""
        try:
            result = await session.execute(text("SELECT COUNT(*) as count FROM routes WHERE status = 'active'"))
            return result.scalar() or 0
        except Exception as e:
            logger.error(f"Error getting total routes: {e}")
            return 0
    
    async def _get_total_buses(self, session: AsyncSession) -> int:
        """Get total number of buses"""
        try:
            result = await session.execute(text("SELECT COUNT(*) as count FROM buses"))
            return result.scalar() or 0
        except Exception as e:
            logger.error(f"Error getting total buses: {e}")
            return 0
    
    async def _get_delay_stats(self, session: AsyncSession) -> Dict[str, float]:
        """Get delay statistics"""
        try:
            # Last 30 days
            query = text("""
                SELECT 
                    AVG(delay_minutes) as avg_delay,
                    COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(*) as on_time_pct
                FROM trips 
                WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
            """)
            
            result = await session.execute(query)
            row = result.fetchone()
            
            return {
                'average_delay': float(row.avg_delay) if row.avg_delay else 0.0,
                'on_time_percentage': float(row.on_time_pct) if row.on_time_pct else 0.0
            }
        except Exception as e:
            logger.error(f"Error getting delay stats: {e}")
            return {'average_delay': 0.0, 'on_time_percentage': 0.0}
    
    async def _get_today_stats(self, session: AsyncSession) -> Dict[str, Any]:
        """Get today's statistics"""
        try:
            # Today's trips and delays
            trips_query = text("""
                SELECT 
                    COUNT(*) as total_trips,
                    AVG(delay_minutes) as avg_delay,
                    COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(*) as on_time_pct
                FROM trips 
                WHERE DATE(started_at) = CURRENT_DATE
            """)
            
            # Total buses
            buses_query = text("SELECT COUNT(*) as total FROM buses")
            
            # Active buses (seen in last 5 minutes)
            active_buses_query = text("""
                SELECT COUNT(*) as count 
                FROM buses 
                WHERE status = 'active' 
                AND last_seen_at > NOW() - INTERVAL '5 minutes'
            """)
            
            # Total routes
            routes_query = text("SELECT COUNT(*) as total FROM routes WHERE status = 'active'")
            
            # Execute all queries
            trips_result, buses_result, active_result, routes_result = await asyncio.gather(
                session.execute(trips_query),
                session.execute(buses_query),
                session.execute(active_buses_query),
                session.execute(routes_query)
            )
            
            trips_row = trips_result.fetchone()
            buses_row = buses_result.fetchone()
            active_row = active_result.fetchone()
            routes_row = routes_result.fetchone()
            
            return {
                'total_trips_today': trips_row.total_trips or 0,
                'average_delay_today': float(trips_row.avg_delay) if trips_row.avg_delay else 0.0,
                'on_time_percentage_today': float(trips_row.on_time_pct) if trips_row.on_time_pct else 0.0,
                'total_buses': buses_row.total or 0,
                'active_buses': active_row.count or 0,
                'total_routes': routes_row.total or 0
            }
        except Exception as e:
            logger.error(f"Error getting today's stats: {e}")
            return {
                'total_trips_today': 0,
                'average_delay_today': 0.0,
                'on_time_percentage_today': 0.0,
                'total_buses': 0,
                'active_buses': 0,
                'total_routes': 0
            }
    
    async def _get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        try:
            from services.delay_predictor import delay_predictor
            
            return {
                'accuracy': 0.85 if delay_predictor.is_trained else None,
                'last_update': delay_predictor.last_training_date
            }
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {}
    
    async def _check_system_health(self) -> str:
        """Check overall system health"""
        try:
            # Check database connection
            async with get_db().__anext__() as session:
                await session.execute(text("SELECT 1"))
            
            # Check model status
            from services.delay_predictor import delay_predictor
            model_ok = delay_predictor.is_trained
            
            if model_ok:
                return 'healthy'
            else:
                return 'warning'
                
        except Exception as e:
            logger.error(f"System health check failed: {e}")
            return 'unhealthy'
    
    def clear_cache(self):
        """Clear cached statistics"""
        self.cache.clear()
        logger.info("Stats cache cleared")


# Global stats service instance
stats_service = StatsService()
