const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
require('dotenv').config();

const INSPECTOR_WALLET = '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec';

async function createInspector() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu');
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    let user = await User.findOne({ walletAddress: INSPECTOR_WALLET.toLowerCase() });

    if (user) {
      console.log('👤 User already exists, updating role to inspector...');
      user.role = 'inspector';
      
      // Add basic profile if not exists
      if (!user.profile) {
        user.profile = {
          name: 'Land Inspector',
          email: 'inspector@bhoomi-setu.com',
          phone: '+91-9876543210',
          kycDocuments: {
            verified: true // Auto-verify inspector
          }
        };
      } else {
        // Ensure KYC is verified for inspector
        if (!user.profile.kycDocuments) {
          user.profile.kycDocuments = { verified: true };
        } else {
          user.profile.kycDocuments.verified = true;
        }
      }
      
      await user.save();
      console.log('✅ User role updated to inspector');
    } else {
      console.log('👤 Creating new inspector user...');
      user = new User({
        walletAddress: INSPECTOR_WALLET.toLowerCase(),
        role: 'inspector',
        profile: {
          name: 'Land Inspector',
          email: 'inspector@bhoomi-setu.com',
          phone: '+91-9876543210',
          kycDocuments: {
            verified: true // Auto-verify inspector
          }
        }
      });
      
      await user.save();
      console.log('✅ New inspector user created');
    }

    console.log('\n📋 Inspector Details:');
    console.log('Wallet Address:', user.walletAddress);
    console.log('Role:', user.role);
    console.log('Name:', user.profile?.name);
    console.log('Email:', user.profile?.email);
    console.log('KYC Verified:', user.profile?.kycDocuments?.verified);
    console.log('\n🎉 Inspector setup complete!');
    console.log('The wallet can now login as a Land Inspector.');

  } catch (error) {
    console.error('❌ Error creating inspector:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

createInspector();