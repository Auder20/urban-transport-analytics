# Urban Transport Analytics 🚌

[![CI Pipeline](https://github.com/Auder20/urban-transport-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/Auder20/urban-transport-analytics/actions/workflows/ci.yml)
[![Security Scan](https://github.com/Auder20/urban-transport-analytics/actions/workflows/security.yml/badge.svg)](https://github.com/Auder20/urban-transport-analytics/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Hub](https://img.shields.io/badge/Docker-Hub-blue.svg)](https://hub.docker.com/u/urban-transport-analytics)

A comprehensive full-stack platform for real-time urban public transport analytics, built with modern microservices architecture.

## 🌟 Features

### 🚌 Real-Time Transport Monitoring
- **Live Bus Tracking**: Real-time GPS tracking with interactive maps
- **Route Visualization**: Dynamic route displays with station information
- **Performance Metrics**: On-time performance, delay analysis, and passenger counts
- **Alert System**: Automated notifications for delays and anomalies

### 📊 Advanced Analytics
- **Delay Prediction**: Machine learning models for accurate delay forecasting
- **Anomaly Detection**: AI-powered identification of unusual patterns
- **Peak Hour Analysis**: Traffic pattern analysis and optimization insights
- **Route Performance**: Comparative analysis between different routes

### 🗺️ Interactive Dashboard
- **Real-Time Maps**: Leaflet.js powered interactive transport maps
- **Data Visualization**: Recharts-based charts and KPI displays
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **User Management**: Role-based access control and authentication

### 🔧 Technical Excellence
- **Microservices**: Scalable architecture with separate services
- **Containerized**: Full Docker support with multi-stage builds
- **API Documentation**: Swagger/OpenAPI documentation for all endpoints
- **CI/CD Pipeline**: Automated testing, security scanning, and deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Analytics    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • ML Models     │
│ • Maps          │    │ • Auth          │    │ • Predictions   │
│ • Charts        │    │ • Real-time     │    │ • Anomaly Det.  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx         │
                    │   (Reverse      │
                    │   Proxy)        │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ • PostgreSQL    │
                    │ • MongoDB       │
                    │ • Redis         │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- Git

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Auder20/urban-transport-analytics.git
   cd urban-transport-analytics
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Analytics API: http://localhost/analytics
   - API Docs: http://localhost/api/docs

### 📊 Database Seeding

5. **Seed the database with sample data**
   ```bash
   docker compose exec backend node scripts/seed-db.js
   ```

6. **Generate historical data**
   ```bash
   docker compose exec backend python scripts/generate-history.py
   ```

7. **Start bus simulation**
   ```bash
   docker compose exec backend node scripts/simulate-buses.js
   ```

### 🔑 Default Login Credentials
- **Email**: admin@uta.com
- **Password**: admin123

## 🛠️ Development Setup

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Analytics Development
```bash
cd analytics
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

### Backend API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### Routes
- `GET /api/routes` - List all routes
- `GET /api/routes/:id` - Get route details
- `GET /api/routes/:id/stations` - Get route stations
- `GET /api/routes/:id/buses` - Get buses on route

#### Buses
- `GET /api/buses` - List all buses
- `GET /api/buses/live` - Get live bus locations
- `POST /api/buses/:id/location` - Update bus location
- `GET /api/buses/:id/history` - Get bus location history

#### Trips
- `GET /api/trips` - List trips
- `POST /api/trips` - Create trip
- `GET /api/trips/:id/delays` - Get trip delays

### Analytics API Endpoints

#### Statistics
- `GET /analytics/stats/kpis` - Get KPIs
- `GET /analytics/stats/system` - Get system stats
- `GET /analytics/delays` - Get delay analysis

#### Predictions
- `GET /analytics/predict/delay` - Predict delay
- `POST /analytics/train/model` - Train ML model

#### Analysis
- `GET /analytics/analyze/route/:id/summary` - Route analysis
- `GET /analytics/analyze/anomalies` - Get anomalies
- `GET /analytics/heatmap` - Get heatmap data

## 🗄️ Database Schema

### PostgreSQL Tables
- `users` - User management and authentication
- `routes` - Transport routes information
- `stations` - Bus stops and terminals
- `buses` - Bus fleet management
- `trips` - Trip records and performance
- `schedules` - Route schedules
- `route_stations` - Route-station relationships

### MongoDB Collections
- `gps_logs` - Real-time GPS location data
- `traffic_events` - Traffic incidents and alerts

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://uta:secret@postgres:5432/uta_db
MONGODB_URI=mongodb://mongo:27017/uta_logs
REDIS_URL=redis://redis:6379
ANALYTICS_URL=http://analytics:8000
NODE_ENV=development
```

#### Analytics (.env)
```env
DATABASE_URL=postgresql://uta:secret@postgres:5432/uta_db
REDIS_URL=redis://redis:6379
MODEL_RETRAIN_SCHEDULE=0 2 * * *
MIN_SAMPLES_FOR_TRAINING=500
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_ANALYTICS_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Analytics Tests
```bash
cd analytics
pytest                  # Run all tests
pytest --cov=.         # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                # Run all tests
npm run test:coverage   # Coverage report
```

## 🚀 Deployment

### Production Deployment

1. **Build and push images**
   ```bash
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml push
   ```

2. **Deploy to production server**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Environment-Specific Configurations
- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.prod.yml`
- **Testing**: `docker-compose.test.yml`

## 📊 Monitoring & Logging

### Health Checks
- Backend: `GET /api/health`
- Analytics: `GET /analytics/health`
- Frontend: HTTP status check

### Logging
- **Backend**: Winston with structured logging
- **Analytics**: Python logging with JSON format
- **Frontend**: Browser console and error tracking

### Metrics
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Custom KPIs**: Transport-specific metrics

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session management with Redis

### Security Features
- Rate limiting
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Security Scanning
- Automated dependency scanning
- Container vulnerability scanning
- Code security analysis
- Secrets detection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

### Code Style
- **Backend**: ESLint + Prettier
- **Analytics**: Black + Flake8
- **Frontend**: ESLint + Prettier
- **Commit messages**: Conventional Commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenStreetMap**: For map data and tiles
- **Leaflet.js**: For interactive mapping
- **React**: For the frontend framework
- **FastAPI**: For the analytics API
- **PostGIS**: For geospatial data handling

## 📞 Support

- **Documentation**: [Wiki](https://github.com/Auder20/urban-transport-analytics/wiki)
- **Issues**: [GitHub Issues](https://github.com/Auder20/urban-transport-analytics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Auder20/urban-transport-analytics/discussions)

## 🗺️ Roadmap

### Version 2.0 (Q2 2024)
- [ ] Mobile app (React Native)
- [ ] Advanced ML models
- [ ] Real-time passenger counting
- [ ] Multi-city support

### Version 2.1 (Q3 2024)
- [ ] Predictive maintenance
- [ ] Route optimization algorithms
- [ ] Integration with transit APIs
- [ ] Advanced reporting features

### Version 3.0 (Q4 2024)
- [ ] AI-powered traffic prediction
- [ ] Autonomous vehicle support
- [ ] Smart city integration
- [ ] Blockchain-based ticketing

---

**Built with ❤️ for smarter urban transportation** 🚌🌆
