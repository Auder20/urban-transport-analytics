import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

# Import the main app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestStatsEndpoints:
    """Test statistics endpoints"""

    @patch('utils.db.test_connection')
    @patch('utils.db.init_db')
    @patch('services.delay_predictor.delay_predictor.load_model')
    @patch('services.anomaly_detector.anomaly_detector.load_model')
    def test_get_kpis_success(self, mock_anomaly_load, mock_delay_load, mock_init_db, mock_test_conn):
        """Test successful KPI retrieval"""
        # Mock successful database connection
        mock_test_conn.return_value = asyncio.Future()
        mock_test_conn.return_value.set_result(True)
        
        # Mock successful initialization
        mock_init_db.return_value = asyncio.Future()
        mock_init_db.return_value.set_result(None)
        
        # Mock model loading
        mock_delay_load.return_value = None
        mock_anomaly_load.return_value = None
        
        # Mock database query for KPIs
        mock_db_result = MagicMock()
        mock_db_result.fetchall.return_value = [
            (50, 1200, 85.5, 15.2, 92.3)  # Mock KPI data
        ]
        
        with patch('utils.db.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value = mock_db_result
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            response = client.get("/stats/kpis")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert "total_buses" in data["data"]
            assert "total_trips" in data["data"]
            assert "avg_delay" in data["data"]

    @patch('utils.db.test_connection')
    @patch('utils.db.init_db')
    @patch('services.delay_predictor.delay_predictor.load_model')
    @patch('services.anomaly_detector.anomaly_detector.load_model')
    def test_get_delays_success(self, mock_anomaly_load, mock_delay_load, mock_init_db, mock_test_conn):
        """Test successful delay statistics retrieval"""
        # Mock successful database connection
        mock_test_conn.return_value = asyncio.Future()
        mock_test_conn.return_value.set_result(True)
        
        # Mock successful initialization
        mock_init_db.return_value = asyncio.Future()
        mock_init_db.return_value.set_result(None)
        
        # Mock model loading
        mock_delay_load.return_value = None
        mock_anomaly_load.return_value = None
        
        # Mock database query for delays
        mock_db_result = MagicMock()
        mock_db_result.fetchall.return_value = [
            ("route_1", 8, 12.5),  # route_id, hour, avg_delay
            ("route_1", 9, 15.2),
            ("route_2", 8, 8.7),
        ]
        
        with patch('utils.db.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value = mock_db_result
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            response = client.get("/stats/delays?days=7")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert isinstance(data["data"], list)

    @patch('utils.db.test_connection')
    @patch('utils.db.init_db')
    @patch('services.delay_predictor.delay_predictor.load_model')
    @patch('services.anomaly_detector.anomaly_detector.load_model')
    def test_get_system_stats_success(self, mock_anomaly_load, mock_delay_load, mock_init_db, mock_test_conn):
        """Test successful system statistics retrieval"""
        # Mock successful database connection
        mock_test_conn.return_value = asyncio.Future()
        mock_test_conn.return_value.set_result(True)
        
        # Mock successful initialization
        mock_init_db.return_value = asyncio.Future()
        mock_init_db.return_value.set_result(None)
        
        # Mock model loading
        mock_delay_load.return_value = None
        mock_anomaly_load.return_value = None
        
        # Mock database query for system stats
        mock_db_result = MagicMock()
        mock_db_result.fetchall.return_value = [
            (10, 5, 3),  # active_routes, active_buses, active_stations
        ]
        
        with patch('utils.db.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_session.execute.return_value = mock_db_result
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            response = client.get("/stats/system")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert "active_routes" in data["data"]
            assert "active_buses" in data["data"]
            assert "active_stations" in data["data"]

    def test_get_delays_invalid_days_parameter(self):
        """Test delay endpoint with invalid days parameter"""
        response = client.get("/stats/delays?days=400")  # Over max limit
        
        assert response.status_code == 422  # Validation error

    def test_get_delays_negative_days_parameter(self):
        """Test delay endpoint with negative days parameter"""
        response = client.get("/stats/delays?days=-1")
        
        assert response.status_code == 422  # Validation error


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment before each test"""
    # Set test environment variables
    os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test_db")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
    
    yield
    
    # Cleanup after test
    pass
