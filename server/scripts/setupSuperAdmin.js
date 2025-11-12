const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const { generateSimplePassword } = require('../utils/passwordGenerator');

dotenv.config();

// Super admin credentials
const SUPER_ADMIN_EMAIL = 'admin@alhikmah.edu.ng';
const SUPER_ADMIN_PASSWORD = 'admin123';
const SUPER_ADMIN_USERNAME = 'superadmin';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for super admin setup'))
.catch(err => console.error('MongoDB connection error:', err));

async function setupSuperAdmin() {
  try {
    console.log('🔧 Setting up super admin...');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ email: SUPER_ADMIN_EMAIL });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      return;
    }

    // Create super admin
    const superAdmin = new Admin({
      username: SUPER_ADMIN_USERNAME,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      firstName: 'Super',
      lastName: 'Admin',
      adminLevel: 'super_admin',
      accessCategories: ['academic', 'administrative', 'infrastructure', 'financial', 'other'],
      isFirstLogin: false,
      isActive: true,
      createdBy: null
    });

    await superAdmin.save();
    
    console.log('✅ Super admin created successfully!');
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`👤 Username: ${SUPER_ADMIN_USERNAME}`);
    console.log('🎯 Admin Level: super_admin');
    console.log('📋 Access: All categories');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupSuperAdmin();
}

module.exports = { setupSuperAdmin };
