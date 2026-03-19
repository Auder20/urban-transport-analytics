import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import time

from config.settings import settings
from utils.db import test_connection, init_db, close_db
from services.delay_predictor import delay_predictor
from services.anomaly_detector import anomaly_detector
from services.stats_service import stats_service
from models.schemas import HealthResponse, ErrorResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Track startup time
startup_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting Urban Transport Analytics Service...")
    
    try:
        # Test database connection
        db_ok = await test_connection()
        if not db_ok:
            logger.warning("⚠️  Database connection failed")
        
        # Initialize database tables
        await init_db()
        
        # Load ML models
        delay_predictor.load_model()
        anomaly_detector.load_model()
        
        startup_duration = time.time() - startup_time
        logger.info(f"✅ Service started successfully in {startup_duration:.2f} seconds")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start service: {e}")
        raise
    
    # Shutdown
    logger.info("🛑 Shutting down Urban Transport Analytics Service...")
    await close_db()
    logger.info("✅ Service shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            code="INTERNAL_ERROR",
            timestamp=datetime.now()
        ).dict()
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint"""
    try:
        db_connected = await test_connection()
        
        return HealthResponse(
            status="healthy" if db_connected else "degraded",
            timestamp=datetime.now(),
            version=settings.api_version,
            database_connected=db_connected,
            redis_connected=True,  # Would implement Redis health check
            model_loaded=delay_predictor.is_trained,
            uptime_seconds=time.time() - startup_time
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now(),
            version=settings.api_version,
            database_connected=False,
            redis_connected=False,
            model_loaded=False,
            uptime_seconds=0
        )


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "service": settings.api_title,
        "version": settings.api_version,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "timestamp": datetime.now().isoformat()
    }


# Import routers
from routers.predictions import router as predictions_router
from routers.analysis import router as analysis_router
from routers.training import router as training_router
from routers.stats import router as stats_router

# Include routers
app.include_router(predictions_router, prefix="/predict")
app.include_router(analysis_router)
app.include_router(training_router)
app.include_router(stats_router)


# Additional endpoints for completeness
@app.get("/stats/system", tags=["stats"])
async def get_system_stats():
    """Get comprehensive system statistics"""
    try:
        return await stats_service.get_system_stats()
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system stats")


@app.get("/stats/kpis", tags=["stats"])
async def get_kpis():
    """Get key performance indicators"""
    try:
        return await stats_service.get_kpis()
    except Exception as e:
        logger.error(f"Error getting KPIs: {e}")
        raise HTTPException(status_code=500, detail="Failed to get KPIs")


@app.get("/predict/delay", tags=["predictions"])
async def predict_delay(
    route_id: str,
    hour: int,
    day_of_week: int,
    month: int = None,
    is_peak_hour: bool = None
):
    """
    Predict delay for a specific route and time
    """
    try:
        features = {
            'route_id': route_id,
            'hour': hour,
            'day_of_week': day_of_week,
            'month': month or datetime.now().month,
            'is_peak_hour': is_peak_hour or (7 <= hour <= 9 or 17 <= hour <= 19)
        }
        
        prediction = delay_predictor.predict(features)
        
        return {
            **features,
            **prediction,
            'model_version': delay_predictor.model_type,
            'prediction_timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error predicting delay: {e}")
        raise HTTPException(status_code=500, detail="Failed to predict delay")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
