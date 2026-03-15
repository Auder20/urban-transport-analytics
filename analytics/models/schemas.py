from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DelayPredictionRequest(BaseModel):
    route_id: str = Field(..., description="Route ID for prediction")
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    is_peak_hour: Optional[bool] = Field(None, description="Whether it's peak hour")


class DelayPredictionResponse(BaseModel):
    route_id: str
    hour: int
    day_of_week: int
    predicted_delay_minutes: float
    confidence_interval: Optional[Dict[str, float]] = None
    model_version: str
    prediction_timestamp: datetime


class RouteAnalysis(BaseModel):
    route_id: str
    route_code: str
    route_name: str
    total_trips: int
    average_delay: float
    max_delay: float
    min_delay: float
    delay_std: float
    on_time_percentage: float
    peak_hours: List[int]
    problematic_stops: List[str]
    recommendations: List[str]


class AnomalyDetection(BaseModel):
    trip_id: str
    route_id: str
    timestamp: datetime
    delay_minutes: float
    anomaly_score: float
    anomaly_type: str
    severity: str
    description: str


class SystemStats(BaseModel):
    total_trips: int
    total_routes: int
    total_buses: int
    average_delay: float
    on_time_percentage: float
    model_accuracy: Optional[float] = None
    last_model_update: Optional[datetime] = None
    cache_hit_rate: Optional[float] = None


class KPIS(BaseModel):
    total_buses: int
    active_buses: int
    total_routes: int
    total_trips_today: int
    on_time_percentage_today: float
    average_delay_today: float
    system_health: str
    last_updated: datetime


class DelayAnalysis(BaseModel):
    route_id: str
    route_code: str
    route_name: str
    hour_bucket: datetime
    trip_count: int
    average_delay: float
    max_delay: float
    problematic_trips: int


class HeatmapPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    weight: float = Field(..., ge=0, le=1)
    bus_info: Optional[Dict[str, Any]] = None


class ProblematicRoute(BaseModel):
    id: str
    route_code: str
    name: str
    color: str
    total_trips: int
    average_delay: float
    max_delay: float
    problematic_trips: int
    on_time_trips: int
    on_time_percentage: float


class PeakHour(BaseModel):
    hour: int
    trip_count: int
    average_delay: float
    problematic_trips: int
    average_passengers: float


class ModelTrainingRequest(BaseModel):
    min_samples: Optional[int] = Field(500, description="Minimum samples required for training")
    force_retrain: Optional[bool] = Field(False, description="Force retraining even if model exists")


class ModelTrainingResponse(BaseModel):
    success: bool
    model_version: str
    training_samples: int
    accuracy_score: Optional[float] = None
    mean_squared_error: Optional[float] = None
    training_time_seconds: float
    message: str


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database_connected: bool
    redis_connected: bool
    model_loaded: bool
    uptime_seconds: float


class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime


class PaginatedResponse(BaseModel):
    items: List[Any]
    page: int
    limit: int
    total: int
    pages: int


class TripData(BaseModel):
    id: str
    bus_id: str
    route_id: str
    driver_id: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    scheduled_start: datetime
    delay_minutes: float
    passenger_count: int
    status: str


class RouteData(BaseModel):
    id: str
    route_code: str
    name: str
    description: Optional[str]
    color: str
    status: str
    total_stops: int
    distance_km: Optional[float]
    created_at: datetime
    updated_at: datetime


class BusData(BaseModel):
    id: str
    plate_number: str
    model: Optional[str]
    year: Optional[int]
    capacity: int
    status: str
    last_lat: Optional[float]
    last_lng: Optional[float]
    last_seen_at: Optional[datetime]
    created_at: datetime


class StationData(BaseModel):
    id: str
    station_code: str
    name: str
    address: Optional[str]
    lat: float
    lng: float
    type: str
    amenities: Dict[str, Any]
    is_active: bool
    created_at: datetime
