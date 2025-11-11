const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const fixAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // First, delete all admins to start fresh
    const result = await Admin.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} admin(s)`);

    // Create super admin
    const superAdmin = new Admin({
      email: 'admin@alhikmah.edu.ng',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      adminLevel: 'super_admin',
      isFirstLogin: false,
      isActive: true,
      permissions: {
        canSeeAllComplaints: true,
        visibleCategories: ['academic', 'administrative', 'infrastructure', 'financial', 'network', 'password', 'additional_credit', 'other'],
        canManageAdmins: true
      }
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email: admin@alhikmah.edu.ng');
    console.log('🔑 Password: admin123');
    console.log('\n🎯 You can now login to the admin panel with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admins:', error.message);
    process.exit(1);
  }
};

// Run the script
fixAdmins();
