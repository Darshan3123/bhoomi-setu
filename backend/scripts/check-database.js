const mongoose = require('mongoose');
require('dotenv').config();

// Simple schemas
const UserSchema = new mongoose.Schema({}, { strict: false });
const PropertySchema = new mongoose.Schema({}, { strict: false });
const PropertyVerificationSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Property = mongoose.model('Property', PropertySchema);
const PropertyVerification = mongoose.model('PropertyVerification', PropertyVerificationSchema);

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu');
    console.log('✅ Connected to MongoDB');
    
    // Get counts
    const [userCount, propertyCount, verificationCount] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      PropertyVerification.countDocuments()
    ]);
    
    console.log('\n📊 DATABASE STATUS:');
    console.log(`Users: ${userCount}`);
    console.log(`Properties: ${propertyCount}`);
    console.log(`Verifications: ${verificationCount}`);
    
    // List all users
    const users = await User.find({}).select('walletAddress profile.name role');
    console.log('\n👥 USERS:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.profile?.name || 'No name'} - ${user.walletAddress} (${user.role})`);
    });
    
    // List all properties
    const properties = await Property.find({}).select('surveyId location propertyType ownerAddress forSale');
    console.log('\n🏠 PROPERTIES:');
    properties.forEach((property, index) => {
      console.log(`${index + 1}. ${property.surveyId} - ${property.location} (${property.propertyType}) - Owner: ${property.ownerAddress} - For Sale: ${property.forSale}`);
    });
    
    // List all verifications
    const verifications = await PropertyVerification.find({}).select('verificationId propertyId status ownerAddress');
    console.log('\n📋 VERIFICATIONS:');
    verifications.forEach((verification, index) => {
      console.log(`${index + 1}. V${verification.verificationId} - ${verification.propertyId} - Status: ${verification.status} - Owner: ${verification.ownerAddress}`);
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkDatabase();