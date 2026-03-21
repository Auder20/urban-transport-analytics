require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
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

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://uta.com', 'https://www.uta.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io globally available
global.io = io;

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('🔌 Client connected to WebSocket:', socket.id);
  
  // Handle authentication for WebSocket connections
  socket.on('auth', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Join user to their personal room for targeted notifications
      const userRoom = `user:${decoded.userId}`;
      socket.join(userRoom);
      socket.userId = decoded.userId;
      socket.emit('authenticated', { userId: decoded.userId });
      
      console.log(`👤 User ${decoded.userId} authenticated and joined room ${userRoom}`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.emit('auth_error', { error: 'Invalid token' });
      socket.disconnect();
    }
  });
  
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
        email: 'support@uta.com'
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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://uta.com', 'https://www.uta.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
