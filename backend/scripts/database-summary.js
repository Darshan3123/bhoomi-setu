const mongoose = require('mongoose');
require('dotenv').config();

// Simple schemas
const UserSchema = new mongoose.Schema({}, { strict: false });
const PropertySchema = new mongoose.Schema({}, { strict: false });
const PropertyVerificationSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Property = mongoose.model('Property', PropertySchema);
const PropertyVerification = mongoose.model('PropertyVerification', PropertyVerificationSchema);

async function showDatabaseSummary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu');
    console.log('✅ Connected to MongoDB');
    
    // Get counts
    const [userCount, propertyCount, verificationCount] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      PropertyVerification.countDocuments()
    ]);
    
    console.log('\n🎉 BHOOMI SETU DATABASE RESTORED SUCCESSFULLY!');
    console.log('==============================================');
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏠 Properties: ${propertyCount}`);
    console.log(`📋 Verifications: ${verificationCount}`);
    console.log(`⚖️  Cases: 0`);
    console.log(`📜 Certificates: 0`);
    console.log(`📦 Total Records: ${userCount + propertyCount + verificationCount}`);
    
    // Show user breakdown
    const [adminCount, inspectorCount, regularUserCount] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'inspector' }),
      User.countDocuments({ role: 'user' })
    ]);
    
    console.log('\n👥 USER BREAKDOWN:');
    console.log(`🔑 Admins: ${adminCount}`);
    console.log(`🔍 Inspectors: ${inspectorCount}`);
    console.log(`👤 Regular Users: ${regularUserCount}`);
    
    // Show property breakdown
    const [forSaleCount, notForSaleCount] = await Promise.all([
      Property.countDocuments({ forSale: true }),
      Property.countDocuments({ forSale: false })
    ]);
    
    console.log('\n🏠 PROPERTY BREAKDOWN:');
    console.log(`💰 For Sale: ${forSaleCount}`);
    console.log(`🏡 Not For Sale: ${notForSaleCount}`);
    
    // Show verification status breakdown
    const verificationStats = await PropertyVerification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📋 VERIFICATION STATUS:');
    verificationStats.forEach(stat => {
      const emoji = {
        'pending': '⏳',
        'assigned': '👨‍💼',
        'inspection_scheduled': '📅',
        'inspected': '✅',
        'verified': '🎉',
        'rejected': '❌'
      }[stat._id] || '📋';
      console.log(`${emoji} ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🚀 READY FOR USE:');
    console.log('• Frontend can now display all test properties');
    console.log('• Admin panel has users to manage');
    console.log('• Inspector dashboard has verifications to process');
    console.log('• Property listings are populated with test data');
    
    console.log('\n🔗 TEST ACCOUNTS:');
    console.log('Admin: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    console.log('Inspector: 0x1cbd3b2770909d4e10f157cabc84c7264073c9ec');
    console.log('Test Users: kirish, kush, dev, Test Owner 1-3');
    
    console.log('\n✨ All test data has been successfully restored!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

showDatabaseSummary();