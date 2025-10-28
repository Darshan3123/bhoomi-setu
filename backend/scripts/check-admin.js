const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu');

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

async function checkAdmin() {
  try {
    console.log('👑 Checking admin user...');

    const adminWallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    
    // Find admin user
    const adminUser = await User.findOne({ walletAddress: adminWallet });
    
    if (adminUser) {
      console.log('✅ Admin user found!');
      console.log('👤 Admin Details:');
      console.log(`   Wallet: ${adminUser.walletAddress}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Name: ${adminUser.profile?.name || 'Not set'}`);
      console.log(`   Email: ${adminUser.profile?.email || 'Not set'}`);
      console.log(`   Created: ${adminUser.createdAt}`);
      
      if (adminUser.role !== 'admin') {
        console.log('⚠️  WARNING: User exists but role is not "admin"');
        console.log('   Fixing role...');
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ Role fixed to "admin"');
      }
    } else {
      console.log('❌ Admin user NOT found!');
      console.log('   Creating admin user...');
      
      const newAdmin = await User.create({
        walletAddress: adminWallet,
        role: 'admin',
        profile: {
          name: 'System Administrator',
          email: 'admin@bhoomi-setu.com',
          phone: '+91-9876543210'
        }
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   ID: ${newAdmin._id}`);
    }
    
    // Check all users to see roles
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.walletAddress} - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error checking admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdmin();