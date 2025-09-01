const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const notificationRoutes = require('./routes/notifications');
const passwordResetRoutes = require('./routes/passwordReset');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config();

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
