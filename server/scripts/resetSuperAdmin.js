const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';

const resetSuperAdmin = async () => {
  let isConnected = false;
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔧 Connecting to MongoDB for reset...');
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
      console.log('✅ MongoDB connected for reset.');
    }

    console.log('🗑️  Deleting existing super admin...');
    await Admin.deleteMany({ adminLevel: 'super_admin' });
    console.log('✅ Existing super admin deleted.');

    console.log('🆕 Creating new super admin...');
    const superAdminData = {
      email: 'superadmin@alhikmah.edu.ng',
      password: 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Administrator',
      adminLevel: 'super_admin',
      isFirstLogin: false,
      isActive: true,
      permissions: {
        canSeeAllComplaints: true,
        visibleCategories: ['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other'],
        canManageAdmins: true
      }
    };

    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();

    console.log('✅ New super admin created successfully.');

    return {
      email: superAdminData.email,
      password: superAdminData.password
    };

  } catch (error) {
    console.error('❌ Error resetting super admin:', error);
    throw error; // Re-throw the error to be caught by the caller
  } finally {
    // Disconnect only if this function initiated the connection
    if (isConnected) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected after reset.');
    }
  }
};

// This allows the script to be run directly from the command line
if (require.main === module) {
  console.log('🔄 Running Super Admin reset script directly...');
  resetSuperAdmin()
    .then(credentials => {
      console.log('\n=== ✅ SUPER ADMIN RESET SUCCESSFULLY ===');
      console.log('📧 Email:', credentials.email);
      console.log('🔑 Password:', credentials.password);
      console.log('========================================\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

// Export the function for use in other parts of the application (like API routes)
module.exports = { resetSuperAdmin }