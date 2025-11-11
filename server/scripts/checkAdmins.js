const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Use environment variables or fallback to default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';

const checkAdmins = async () => {
  try {
    console.log('🔍 Checking existing admins in database...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('MongoDB URI:', MONGODB_URI ? 'Found' : 'Not found - using localhost');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Get all admins
    const admins = await Admin.find({}).select('-password');
    
    console.log('\n📊 DATABASE ADMIN SUMMARY:');
    console.log(`Total Admins Found: ${admins.length}`);
    console.log('=====================================');
    
    if (admins.length === 0) {
      console.log('❌ NO ADMINS FOUND IN DATABASE!');
      console.log('🚨 This explains why login is failing.');
      console.log('💡 Run: node server/scripts/setupSuperAdminManual.js');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\n👤 Admin #${index + 1}:`);
        console.log(`   📧 Email: ${admin.email || 'Not set'}`);
        console.log(`   👤 Username: ${admin.username || 'Not set'}`);
        console.log(`   🏷️  Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   🎖️  Level: ${admin.adminLevel}`);
        console.log(`   🟢 Active: ${admin.isActive ? 'Yes' : 'No'}`);
        console.log(`   🔑 First Login: ${admin.isFirstLogin ? 'Required' : 'Completed'}`);
        console.log(`   📅 Created: ${admin.createdAt}`);
        console.log(`   🎯 Permissions:`);
        if (admin.permissions) {
          console.log(`      - See All Complaints: ${admin.permissions.canSeeAllComplaints ? 'Yes' : 'No'}`);
          console.log(`      - Manage Admins: ${admin.permissions.canManageAdmins ? 'Yes' : 'No'}`);
          console.log(`      - Categories: ${admin.permissions.visibleCategories?.join(', ') || 'None'}`);
        } else {
          console.log('      - No permissions set');
        }
      });
    }
    
    // Check specifically for super admin
    const superAdmin = await Admin.findOne({ adminLevel: 'super_admin' });
    
    console.log('\n🔍 SUPER ADMIN CHECK:');
    if (superAdmin) {
      console.log('✅ Super Admin EXISTS');
      console.log(`   📧 Login Email: ${superAdmin.email}`);
      console.log(`   🟢 Status: ${superAdmin.isActive ? 'Active' : 'Inactive'}`);
      console.log('   💡 Try logging in with:');
      console.log('      Email: superadmin@alhikmah.edu.ng');
      console.log('      Password: SuperAdmin@123');
    } else {
      console.log('❌ Super Admin NOT FOUND');
      console.log('🚨 This is why login is failing!');
      console.log('💡 Solution: Run setup script');
    }
    
    console.log('\n=====================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admins:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

// Run the script
checkAdmins();
