const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  walletAddress: String,
  role: String,
  profile: {
    name: String,
    email: String,
    phone: String,
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function setupAdmin() {
  try {
    console.log('👑 Setting up admin user...');

    const adminWallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    
    // Remove any existing user with this wallet
    await User.deleteMany({ walletAddress: adminWallet });
    
    // Create admin user
    const adminUser = await User.create({
      walletAddress: adminWallet,
      role: 'admin',
      profile: {
        name: 'System Administrator',
        email: 'admin@bhoomi-setu.com',
        phone: '+91-9876543210'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('👤 Admin Details:');
    console.log(`   Wallet: ${adminUser.walletAddress}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Name: ${adminUser.profile.name}`);
    console.log(`   Email: ${adminUser.profile.email}`);
    
    console.log('\n🎯 Admin Panel Access:');
    console.log('   1. Connect MetaMask with wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('   2. Login/Signup on the website');
    console.log('   3. You will be automatically redirected to admin panel');
    console.log('   4. Admin panel URL: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

setupAdmin();