const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

async function checkUsers() {
  try {
    console.log('=== CHECKING DATABASE USERS ===');
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all users (excluding passwords)
    const users = await User.find({}).select('-password -resetPasswordToken').sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${users.length} users in database:\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 You may need to create an admin user first');
    } else {
      users.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨‍💼 Role: ${user.role}`);
        console.log(`   📛 Name: ${user.firstName} ${user.lastName}`);
        console.log(`   🎓 Student ID: ${user.studentId || 'N/A'}`);
        console.log(`   🏫 Department: ${user.department || 'N/A'}`);
        console.log(`   📅 Year: ${user.year || 'N/A'}`);
        console.log(`   ✅ Active: ${user.isActive}`);
        console.log(`   🕐 Created: ${user.createdAt}`);
        console.log(`   🔒 Password: [HIDDEN FOR SECURITY]`);
        console.log('   ' + '─'.repeat(40));
      });
      
      // Summary by role
      const roleCount = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Users by Role:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} users`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the check
checkUsers();
