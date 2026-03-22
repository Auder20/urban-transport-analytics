require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectMongo } = require('./config/mongodb');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const gpsService = require('./services/gps.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const busesRoutes = require('./routes/buses.routes');
const routesRoutes = require('./routes/routes.routes');
const stationsRoutes = require('./routes/stations.routes');
const tripsRoutes = require('./routes/trips.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const searchRoutes = require('./routes/search.routes');
const schedulesRoutes = require('./routes/schedules.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Parse allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io globally available and accessible via app
global.io = io;
app.set('io', io);

// Handle WebSocket connections
io.on('connection', async (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Authenticate from handshake (sent by client via `auth: { token }` in io())
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRoom = `user:${decoded.userId}`;
      socket.join(userRoom);
      socket.userId = decoded.userId;
      socket.emit('authenticated', { userId: decoded.userId });
      console.log(`👤 User ${decoded.userId} joined room ${userRoom}`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.emit('auth_error', { error: 'Invalid token' });
      // Optionally disconnect: socket.disconnect()
    }
  }
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from WebSocket:', socket.id);
  });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Urban Transport Analytics API',
      version: '1.0.0',
      description: 'RESTful API for urban transport analytics and management',
      contact: {
        name: 'Urban Transport Analytics Team',
        email: process.env.CONTACT_EMAIL || 'support@uta.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.uta.com' : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Define custom Morgan token for userId
morgan.token('userId', (req) => req.user?.userId || '-');

app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms [:userId]',
  {
    skip: (req) => req.path === '/health'
  }
));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Prometheus metrics endpoint
const client = require('prom-client');
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  const metricsToken = process.env.METRICS_TOKEN
  if (metricsToken) {
    const authHeader = req.headers.authorization
    if (!authHeader || authHeader !== `Bearer ${metricsToken}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UTA API Documentation'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/notifications', notificationsRoutes);

// WebSocket for real-time updates (if needed in the future)
// app.ws('/ws', (ws, req) => {
//   // Handle WebSocket connections for real-time bus tracking
// });

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize MongoDB connection
const initializeMongo = async () => {
  try {
    await connectMongo();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Don't crash the app, continue without MongoDB for now
  }
};

// Initialize Redis pub/sub for real-time updates
const initializePubSub = async () => {
  try {
    await gpsService.initializePubSub();
    console.log('Redis pub/sub initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis pub/sub:', error);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize services
initializeMongo();
initializePubSub();

module.exports = { app, server, io };
