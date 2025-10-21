const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resetSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Count existing admins
    const adminCount = await Admin.countDocuments();
    console.log(`Found ${adminCount} admins in the database`);

    // Delete all existing admins
    if (adminCount > 0) {
      const result = await Admin.deleteMany({});
      console.log(`Deleted ${result.deletedCount} admins from the database`);
    }

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

    console.log('\n=== NEW SUPER ADMIN CREATED ===');
    console.log('Email: superadmin@alhikmah.edu.ng');
    console.log('Password: SuperAdmin@123');
    console.log('Admin Level: super_admin');
    console.log('Status: Active');
    console.log('First Login Required: No');
    console.log('Permissions: Full access to all complaints and admin management');
    console.log('===============================\n');

    console.log('✅ Super Admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting super admin:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  console.log('🔄 Resetting Super Admin...');
  console.log('This will delete all existing admins and create a fresh super admin.');
  resetSuperAdmin();
}

module.exports = { resetSuperAdmin };
