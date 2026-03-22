import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

# Import the main app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""

    @patch('utils.db.test_connection')
    @patch('utils.db.init_db')
    @patch('services.delay_predictor.delay_predictor.load_model')
    @patch('services.anomaly_detector.anomaly_detector.load_model')
    def test_health_check_success(self, mock_anomaly_load, mock_delay_load, mock_init_db, mock_test_conn):
        """Test successful health check"""
        # Mock successful database connection
        mock_test_conn.return_value = asyncio.Future()
        mock_test_conn.return_value.set_result(True)
        
        # Mock successful initialization
        mock_init_db.return_value = asyncio.Future()
        mock_init_db.return_value.set_result(None)
        
        # Mock model loading
        mock_delay_load.return_value = None
        mock_anomaly_load.return_value = None
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        assert "uptime" in data
        assert "database" in data
        assert "models" in data

    @patch('utils.db.test_connection')
    @patch('utils.db.init_db')
    @patch('services.delay_predictor.delay_predictor.load_model')
    @patch('services.anomaly_detector.anomaly_detector.load_model')
    def test_health_check_db_failure(self, mock_anomaly_load, mock_delay_load, mock_init_db, mock_test_conn):
        """Test health check with database failure"""
        # Mock failed database connection
        mock_test_conn.return_value = asyncio.Future()
        mock_test_conn.return_value.set_result(False)
        
        # Mock successful initialization
        mock_init_db.return_value = asyncio.Future()
        mock_init_db.return_value.set_result(None)
        
        # Mock model loading
        mock_delay_load.return_value = None
        mock_anomaly_load.return_value = None
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"]["status"] == "disconnected"

    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "description" in data
        assert data["name"] == "Urban Transport Analytics API"

    def test_invalid_endpoint(self):
        """Test that invalid endpoints return 404"""
        response = client.get("/invalid-endpoint")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data


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
    # Remove test environment variables if needed
    pass
