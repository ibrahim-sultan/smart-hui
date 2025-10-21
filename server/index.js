console.log('=== STARTING SMART HUI SERVER ===');
console.log('Loading required modules...');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { resetSuperAdmin } = require('./scripts/resetSuperAdmin');

console.log('Core modules loaded successfully');

// Load environment variables
dotenv.config();
console.log('Environment variables loaded');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 5000);

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set, using default (not secure for production)');
  process.env.JWT_SECRET = 'fallback-jwt-secret-change-this-in-production';
}

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  WARNING: MONGODB_URI not set, using localhost');
}

console.log('Environment validation completed');

// Run the reset super admin script on startup
if (process.env.NODE_ENV === 'production') {
  console.log('Running resetSuperAdmin script...');
  resetSuperAdmin().then(() => {
    console.log('resetSuperAdmin script finished.');
  }).catch(err => {
    console.error('Error running resetSuperAdmin script:', err);
  });
}

console.log('Loading route modules...');

// Import routes with error handling
let authRoutes, userRoutes, complaintRoutes, notificationRoutes, passwordResetRoutes, adminRoutes, debugRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded');
} catch (err) {
  console.error('✗ Failed to load auth routes:', err.message);
  throw err;
}

try {
  userRoutes = require('./routes/users');
  console.log('✓ User routes loaded');
} catch (err) {
  console.error('✗ Failed to load user routes:', err.message);
  throw err;
}

try {
  complaintRoutes = require('./routes/complaints');
  console.log('✓ Complaint routes loaded');
} catch (err) {
  console.error('✗ Failed to load complaint routes:', err.message);
  throw err;
}

try {
  notificationRoutes = require('./routes/notifications');
  console.log('✓ Notification routes loaded');
} catch (err) {
  console.error('✗ Failed to load notification routes:', err.message);
  throw err;
}

try {
  passwordResetRoutes = require('./routes/passwordReset');
  console.log('✓ Password reset routes loaded');
} catch (err) {
  console.error('✗ Failed to load password reset routes:', err.message);
  throw err;
}

try {
  adminRoutes = require('./routes/admin');
  console.log('✓ Admin routes loaded');
} catch (err) {
  console.error('✗ Failed to load admin routes:', err.message);
  throw err;
}

try {
  debugRoutes = require('./routes/debug');
  console.log('✓ Debug routes loaded');
} catch (err) {
  console.error('✗ Failed to load debug routes:', err.message);
  debugRoutes = null;
}

console.log('All route modules loaded successfully');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with fallback
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without database connection - some features may not work');
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/admin', adminRoutes);

// Debug routes (only in development/production for troubleshooting)
if (debugRoutes) {
  app.use('/api/debug', debugRoutes);
  console.log('✓ Debug routes enabled at /api/debug');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to check build status
app.get('/api/debug/build', (req, res) => {
  const fs = require('fs');
  const buildPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(buildPath, 'index.html');
  
  res.json({
    environment: process.env.NODE_ENV,
    buildPath: buildPath,
    buildExists: fs.existsSync(buildPath),
    indexExists: fs.existsSync(indexPath),
    workingDirectory: __dirname,
    processDir: process.cwd(),
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  const fs = require('fs');
  
  // Check if build directory exists
  if (fs.existsSync(buildPath)) {
    // Serve static files from the React app build directory
    app.use(express.static(buildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ 
          message: 'React build not found. Please check build process.',
          buildPath: buildPath,
          indexExists: fs.existsSync(indexPath)
        });
      }
    });
  } else {
    console.error('Build directory not found:', buildPath);
    app.get('*', (req, res) => {
      res.status(503).json({ 
        message: 'Application build not ready. Build directory not found.',
        expectedPath: buildPath 
      });
    });
  }
} else {
  // Development mode - just API endpoints
  app.get('/', (req, res) => {
    res.json({ message: 'Smart HUI API is running in development mode' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR OCCURRED ===');
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('======================');
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    url: req.url,
    method: req.method
  });
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
});

const PORT = process.env.PORT || 5000;
try {
  app.listen(PORT, () => {
    console.log(`✅ Server running successfully on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check available at: /api/health`);
    console.log('=== STARTUP COMPLETE ===');
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}
