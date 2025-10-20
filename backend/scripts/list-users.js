const mongoose = require('mongoose');
require('dotenv').config();

// User schema (simplified for script)
const UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['user', 'inspector', 'admin'],
    default: 'user'
  },
  profile: {
    name: String,
    email: String,
    phone: String,
    aadhaarNumber: String,
    panNumber: String,
    kycDocuments: {
      aadhaar: String,
      pan: String,
      verified: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

async function listUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    
    console.log(`\nFound ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Wallet: ${user.walletAddress}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.profile?.name || 'N/A'}`);
      console.log(`   Email: ${user.profile?.email || 'N/A'}`);
      console.log(`   Registered: ${user.createdAt}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('No users found. Please register a user first.');
    }

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

listUsers();