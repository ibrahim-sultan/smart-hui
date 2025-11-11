const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const clearAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hikmah', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in the database`);

    if (userCount === 0) {
      console.log('No users to delete');
    } else {
      // Delete all users
      const result = await User.deleteMany({});
      console.log(`Successfully deleted ${result.deletedCount} users from the database`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  console.log('⚠️  WARNING: This will delete ALL users from the database!');
  console.log('Starting user cleanup in 3 seconds...');
  
  setTimeout(() => {
    clearAllUsers();
  }, 3000);
}

module.exports = { clearAllUsers };
