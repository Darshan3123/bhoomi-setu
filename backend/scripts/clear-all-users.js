const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu');

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  walletAddress: String,
  role: String,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function clearAllUsers() {
  try {
    console.log('🗑️  Clearing all users from database...');

    // Count existing users
    const count = await User.countDocuments();
    console.log(`📊 Found ${count} users to remove`);

    if (count === 0) {
      console.log('✅ No users found. Database is already clean.');
      return;
    }

    // Show users before deletion
    const users = await User.find({});
    console.log('\n📋 Users to be removed:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.walletAddress} (${user.role})`);
    });

    // Delete all users
    const result = await User.deleteMany({});
    
    console.log(`\n✅ Successfully removed ${result.deletedCount} users`);
    console.log('🎉 Database is now clean - no users remain');

  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearAllUsers();