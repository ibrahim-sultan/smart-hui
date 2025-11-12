const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Use environment variables or fallback to default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';

const setupSuperAdmin = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI ? 'Found' : 'Not found - using localhost');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ 
      adminLevel: 'super_admin' 
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Username:', existingSuperAdmin.username);
      console.log('   Admin Level:', existingSuperAdmin.adminLevel);
      console.log('   Active:', existingSuperAdmin.isActive);
      console.log('   Created:', existingSuperAdmin.createdAt);
      
      // Update password to ensure it's correct
      console.log('🔄 Updating super admin password...');
      existingSuperAdmin.password = 'SuperAdmin@123';
      existingSuperAdmin.isActive = true;
      await existingSuperAdmin.save();
      console.log('✅ Super admin password updated successfully');
      
      process.exit(0);
    }

    console.log('🆕 Creating new super admin...');

    // Create new super admin with updated credentials
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

    console.log('\n=== ✅ SUPER ADMIN CREATED SUCCESSFULLY ===');
    console.log('🌐 Login URL: https://smart-hui-1.onrender.com/admin/login');
    console.log('📧 Email: superadmin@alhikmah.edu.ng');
    console.log('🔑 Password: SuperAdmin@123');
    console.log('👑 Admin Level: super_admin');
    console.log('🟢 Status: Active');
    console.log('🔓 First Login Required: No');
    console.log('🎯 Permissions: Full access to all complaints and admin management');
    console.log('==========================================\n');

    console.log('✅ Super Admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

// Run the script
console.log('🚀 Starting Super Admin Setup...');
console.log('Environment:', process.env.NODE_ENV || 'development');
setupSuperAdmin();
