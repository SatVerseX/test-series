const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
// Load environment variables first
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

// Set environment to development if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
console.log('Environment:', process.env.NODE_ENV);

console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Import custom CORS middleware
const corsMiddleware = require('./middleware/cors');

const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const testSeriesRoutes = require('./routes/testSeriesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

const app = express();

// Apply custom CORS middleware before anything else
app.use(corsMiddleware);

// CORS configuration
const allowedOrigins = [
  'https://test-series-frontend-one.vercel.app',
  'https://dist-grd853wzy-satish-pals-projects.vercel.app',
  'https://frontend-9mib7iesp-satish-pals-projects.vercel.app',
  'https://frontend-satish-pals-projects.vercel.app',
  'https://dist-one-red.vercel.app',
  'http://localhost:5173'
];

// Apply CORS middleware before any route handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://frontend-satish-pals-projects.vercel.app');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Also keep the regular cors middleware as a fallback
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, 'https://frontend-satish-pals-projects.vercel.app');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: '*'
}));

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  console.log('Handling OPTIONS preflight request for:', req.path);
  console.log('Request headers:', req.headers);
  
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://test-series-frontend-one.vercel.app',
    'https://dist-grd853wzy-satish-pals-projects.vercel.app',
    'https://frontend-9mib7iesp-satish-pals-projects.vercel.app',
    'https://frontend-satish-pals-projects.vercel.app',
    'https://vidya-test-series.vercel.app',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://frontend-satish-pals-projects.vercel.app');
  }
  
  // Allow all requested headers
  const requestHeaders = req.headers['access-control-request-headers'];
  if (requestHeaders) {
    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
  } else {
    res.setHeader('Access-Control-Allow-Headers', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  res.status(204).end();
});

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/test-series', testSeriesRoutes);
app.use('/api/purchases', purchaseRoutes);

// Quick response endpoint for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Add mongoose connection options
const mongooseOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 100,
  wtimeoutMS: 10000
};

// Add console logs to debug MongoDB connection
console.log('Connecting to MongoDB:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');

// Fallback to a direct connection string if environment variable is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://satish151104:c3jKc57T74XdJKne@cluster0.ruzmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Set timeout for MongoDB connection
const connectWithRetry = async (retries = 5) => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${6 - retries}):`, err);
    // In production, log more details
    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB connection details:', { 
        message: err.message,
        stack: err.stack,
        code: err.code,
        name: err.name
      });
    }
    
    if (retries > 0) {
      console.log(`Retrying connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    }
  }
};

connectWithRetry();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});