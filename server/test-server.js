console.log('=== TESTING SERVER STARTUP ===');

try {
  console.log('1. Loading express...');
  const express = require('express');
  console.log('✓ Express loaded');

  console.log('2. Loading mongoose...');
  const mongoose = require('mongoose');
  console.log('✓ Mongoose loaded');

  console.log('3. Loading dotenv...');
  const dotenv = require('dotenv');
  dotenv.config();
  console.log('✓ Dotenv loaded');

  console.log('4. Loading bcryptjs...');
  const bcrypt = require('bcryptjs');
  console.log('✓ bcryptjs loaded');

  console.log('5. Loading jsonwebtoken...');
  const jwt = require('jsonwebtoken');
  console.log('✓ JWT loaded');

  console.log('6. Testing User model...');
  const User = require('./models/User');
  console.log('✓ User model loaded');

  console.log('7. Testing routes...');
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded');

  console.log('8. Creating Express app...');
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working!' });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Test server running on port ${PORT}`);
  });

} catch (error) {
  console.error('❌ ERROR DURING STARTUP:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
