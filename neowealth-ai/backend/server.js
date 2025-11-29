require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/database');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 4000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 NeoWealth.AI Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /',
      auth: 'POST /api/auth/*',
      users: 'GET /api/users/*',
      transactions: 'GET /api/transactions/*',
      goals: 'GET /api/goals/*',
      wallet: 'GET /api/wallet/*',
      analytics: 'GET /api/analytics/*',
      rewards: 'POST /api/rewards/*',
      hives: 'GET /api/hives/*',
      ai: 'POST /api/ai/*'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/hives', require('./routes/hives'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/ai', require('./routes/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize models
    require('./models');
    
    // Start background jobs
    const JobScheduler = require('./jobs/scheduler');
    JobScheduler.start();
    
    // Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 NeoWealth.AI Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🗄️ Database: SQLite`);
      console.log(`\n✅ Server ready at http://localhost:${PORT}`);
      console.log(`🌐 Network access: http://192.168.0.100:${PORT}`);
      console.log(`📱 Mobile access: http://192.168.0.100:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();