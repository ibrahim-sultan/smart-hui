const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Use environment variables or fallback to default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';

const debugSuperAdminLogin = async () => {
  try {
    console.log('🔧 SUPER ADMIN LOGIN DEBUGGER');
    console.log('===============================');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('MongoDB URI:', MONGODB_URI ? 'Connected' : 'Using localhost');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Test credentials
    const testEmail = 'superadmin@alhikmah.edu.ng';
    const testPassword = 'SuperAdmin@123';
    
    console.log('\n🔍 DEBUGGING LOGIN PROCESS:');
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${testPassword}`);
    
    // Step 1: Check if any admin exists with this email
    console.log('\n📊 Step 1: Checking email search...');
    const adminByEmail = await Admin.findOne({ email: testEmail });
    
    if (!adminByEmail) {
      console.log('❌ No admin found with email:', testEmail);
      console.log('🔍 Let me check all admins in database...');
      
      const allAdmins = await Admin.find({}).select('-password');
      console.log(`Found ${allAdmins.length} admins total:`);
      
      allAdmins.forEach((admin, index) => {
        console.log(`\n👤 Admin #${index + 1}:`);
        console.log(`   📧 Email: ${admin.email || 'Not set'}`);
        console.log(`   👤 Username: ${admin.username || 'Not set'}`);
        console.log(`   🏷️  Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   🎖️  Level: ${admin.adminLevel}`);
        console.log(`   🟢 Active: ${admin.isActive}`);
      });
      
      console.log('\n🚨 CREATING SUPER ADMIN NOW...');
      
      // Create super admin
      const newSuperAdmin = new Admin({
        email: testEmail,
        password: testPassword,
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
      });
      
      await newSuperAdmin.save();
      console.log('✅ Super admin created successfully!');
      
      // Now test login again
      const createdAdmin = await Admin.findOne({ email: testEmail });
      console.log('🔍 Testing login with newly created admin...');
      
      return await testLoginProcess(createdAdmin, testPassword);
    }
    
    // Step 2: Check admin level requirement
    console.log('✅ Admin found with email');
    console.log(`📧 Email: ${adminByEmail.email}`);
    console.log(`🎖️  Admin Level: ${adminByEmail.adminLevel}`);
    console.log(`🟢 Active: ${adminByEmail.isActive}`);
    console.log(`🔑 First Login: ${adminByEmail.isFirstLogin}`);
    
    // Step 3: Test the specific login logic from admin route
    console.log('\n📊 Step 2: Testing login logic from route...');
    
    // Simulate the exact logic from admin.js line 61
    const adminForLogin = await Admin.findOne({ 
      email: testEmail, 
      adminLevel: 'super_admin' 
    });
    
    if (!adminForLogin) {
      console.log('❌ Admin login query failed!');
      console.log('🔍 The issue is in the login query logic');
      console.log('Expected adminLevel: super_admin');
      console.log('Actual adminLevel:', adminByEmail.adminLevel);
      
      // Fix the admin level
      console.log('🔧 Fixing admin level...');
      adminByEmail.adminLevel = 'super_admin';
      adminByEmail.isActive = true;
      adminByEmail.password = testPassword; // Reset password
      await adminByEmail.save();
      
      console.log('✅ Admin level fixed to: super_admin');
      return await testLoginProcess(adminByEmail, testPassword);
    }
    
    console.log('✅ Admin login query successful');
    
    return await testLoginProcess(adminForLogin, testPassword);
    
  } catch (error) {
    console.error('❌ Error in debug process:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

async function testLoginProcess(admin, testPassword) {
  console.log('\n📊 Step 3: Testing password comparison...');
  
  try {
    // Test password comparison
    const isMatch = await admin.comparePassword(testPassword);
    
    console.log(`🔐 Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log('❌ Password comparison failed!');
      console.log('🔧 Resetting password to ensure it works...');
      
      // Manually hash and set password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      await Admin.updateOne(
        { _id: admin._id },
        { 
          password: hashedPassword,
          isActive: true,
          adminLevel: 'super_admin'
        }
      );
      
      console.log('✅ Password has been reset and hashed properly');
      
      // Test again
      const updatedAdmin = await Admin.findById(admin._id);
      const newMatch = await updatedAdmin.comparePassword(testPassword);
      
      console.log(`🔐 New password match result: ${newMatch}`);
      
      if (newMatch) {
        console.log('✅ PASSWORD FIXED! Login should work now.');
      } else {
        console.log('❌ Password still not working. Check bcrypt implementation.');
      }
    } else {
      console.log('✅ Password comparison successful!');
    }
    
    // Final verification
    console.log('\n🎯 FINAL LOGIN TEST:');
    console.log('Simulating exact login process...');
    
    const finalAdmin = await Admin.findOne({ 
      email: 'superadmin@alhikmah.edu.ng', 
      adminLevel: 'super_admin' 
    });
    
    if (!finalAdmin) {
      console.log('❌ Final admin query failed');
      process.exit(1);
    }
    
    console.log('✅ Final admin query successful');
    console.log(`📧 Email: ${finalAdmin.email}`);
    console.log(`🎖️  Admin Level: ${finalAdmin.adminLevel}`);
    console.log(`🟢 Active: ${finalAdmin.isActive}`);
    
    const finalPasswordMatch = await finalAdmin.comparePassword(testPassword);
    console.log(`🔐 Final password match: ${finalPasswordMatch}`);
    
    if (finalPasswordMatch && finalAdmin.isActive) {
      console.log('\n🎉 SUCCESS! Super admin login should work now!');
      console.log('🌐 Try logging in at: https://smart-hui-1.onrender.com/admin/login');
      console.log('📧 Email: superadmin@alhikmah.edu.ng');
      console.log('🔑 Password: SuperAdmin@123');
    } else {
      console.log('\n❌ Login test still failing');
      console.log('Issues found:');
      if (!finalPasswordMatch) console.log('- Password comparison failed');
      if (!finalAdmin.isActive) console.log('- Admin account not active');
    }
    
    console.log('\n===============================');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in password testing:', error);
    process.exit(1);
  }
}

// Run the script
debugSuperAdminLogin();
