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

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Admin wallet address (you can change this to your actual admin wallet)
    const adminWalletAddress = '0x1234567890123456789012345678901234567890';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ walletAddress: adminWalletAddress.toLowerCase() });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.walletAddress);
      console.log('Updating role to admin...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin role updated successfully!');
    } else {
      // Create new admin user
      const adminUser = new User({
        walletAddress: adminWalletAddress.toLowerCase(),
        role: 'admin',
        profile: {
          name: 'System Administrator',
          email: 'admin@bhoomisetu.com',
          phone: '+91-9999999999',
          aadhaarNumber: '123456789012',
          panNumber: 'ADMIN1234A',
          kycDocuments: {
            verified: true
          }
        }
      });

      await adminUser.save();
      console.log('Admin user created successfully!');
      console.log('Admin Wallet Address:', adminWalletAddress);
    }

    console.log('\nTo use this admin account:');
    console.log('1. Connect MetaMask with wallet address:', adminWalletAddress);
    console.log('2. Sign the authentication message');
    console.log('3. Navigate to /admin page');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();