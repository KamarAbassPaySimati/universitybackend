const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./config/database'); // Initialize MongoDB connection

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes with error handling
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (err) {
  console.log('⚠️ Auth routes not loaded:', err.message);
}

try {
  app.use('/api/students', require('./routes/students'));
} catch (err) {
  console.log('⚠️ Students routes not loaded:', err.message);
}

try {
  app.use('/api/faculty', require('./routes/faculty'));
} catch (err) {
  console.log('⚠️ Faculty routes not loaded:', err.message);
}

try {
  app.use('/api/academics', require('./routes/academics'));
} catch (err) {
  console.log('⚠️ Academics routes not loaded:', err.message);
}

try {
  app.use('/api/administration', require('./routes/administration'));
} catch (err) {
  console.log('⚠️ Administration routes not loaded:', err.message);
}

try {
  app.use('/api/dashboard', require('./routes/dashboard'));
} catch (err) {
  console.log('⚠️ Dashboard routes not loaded:', err.message);
}

try {
  app.use('/api/upload', require('./routes/upload'));
} catch (err) {
  console.log('⚠️ Upload routes not loaded:', err.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'University Management System API' });
});

// Debug route
app.get('/api/debug', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'Debug Info',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
    mongoState: mongoose.connection.readyState,
    routes: [
      '/api/health',
      '/api/debug', 
      '/api/test-mongo',
      '/api/auth',
      '/api/students',
      '/api/faculty',
      '/api/academics',
      '/api/administration',
      '/api/dashboard',
      '/api/upload'
    ]
  });
});

// MongoDB test endpoint
app.get('/api/test-mongo', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        error: 'MongoDB not connected', 
        readyState: mongoose.connection.readyState,
        states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
      });
    }
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ 
      status: 'MongoDB Connected', 
      collections: collections.map(c => c.name),
      dbName: mongoose.connection.db.databaseName,
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});