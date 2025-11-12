const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

async function fixAllUsers() {
  try {
    console.log('=== FIXING ALL USER ISSUES ===');
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users to fix\n`);

    // New password for all users
    const newPassword = 'passwordhui';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    for (let user of users) {
      console.log(`🔧 Fixing user: ${user.email}`);
      
      // Fix firstName and lastName based on email or set defaults
      let firstName = user.firstName;
      let lastName = user.lastName;
      
      if (!firstName || !lastName || firstName === 'undefined' || lastName === 'undefined') {
        // Extract name from email or set defaults based on role
        const emailPart = user.email.split('@')[0];
        
        if (user.email === 'bolaji@yahoo.com') {
          firstName = 'Bolaji';
          lastName = 'Staff';
        } else if (user.email === 'saibrahim@alhikmah.edu.ng') {
          firstName = 'Ibrahim';
          lastName = 'Admin';
        } else if (user.email === 'ibrahimsultanabiola@yahoo.com') {
          firstName = 'Ibrahim';
          lastName = 'Sultan';
        } else {
          // Default fallback
          firstName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
          lastName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
        
        console.log(`   📝 Setting name: ${firstName} ${lastName}`);
      }

      // Update user with fixes
      await User.findByIdAndUpdate(user._id, {
        $set: {
          firstName: firstName,
          lastName: lastName,
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log(`   ✅ Updated: ${firstName} ${lastName} (${user.email}) - Role: ${user.role}`);
      console.log(`   🔑 Password set to: ${newPassword}`);
      console.log('   ' + '─'.repeat(50));
    }

    console.log('\n🎉 All users have been fixed!');
    console.log('\n📋 SUMMARY OF FIXED USERS:');
    
    // Get updated users to verify
    const updatedUsers = await User.find({}).select('-password').sort({ role: 1 });
    
    updatedUsers.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: passwordhui`);
      console.log(`   👨‍💼 Role: ${user.role}`);
      console.log(`   📛 Name: ${user.firstName} ${user.lastName}`);
      if (user.studentId) console.log(`   🎓 Student ID: ${user.studentId}`);
      if (user.department) console.log(`   🏫 Department: ${user.department}`);
      if (user.year) console.log(`   📅 Year: ${user.year}`);
      console.log(`   ✅ Active: ${user.isActive}`);
    });

    console.log('\n🔐 All passwords have been reset to: passwordhui');
    console.log('✅ All users are now active and have proper names');

  } catch (error) {
    console.error('❌ Error fixing users:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the fix
console.log('🚀 Starting user fix process...');
fixAllUsers();
