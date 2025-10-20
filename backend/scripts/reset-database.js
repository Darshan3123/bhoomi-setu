const mongoose = require('mongoose');
require('dotenv').config();

// Simple schemas for database reset
const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const PropertySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const PropertyVerificationSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const CaseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const CertificateSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

// Create models
const User = mongoose.model('User', UserSchema);
const Property = mongoose.model('Property', PropertySchema);
const PropertyVerification = mongoose.model('PropertyVerification', PropertyVerificationSchema);
const Case = mongoose.model('Case', CaseSchema);
const Certificate = mongoose.model('Certificate', CertificateSchema);

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    return false;
  }
}

async function resetDatabase() {
  console.log('🔄 BHOOMI SETU DATABASE RESET');
  console.log('=============================');
  
  try {
    // Get current counts
    const [userCount, propertyCount, verificationCount, caseCount, certificateCount] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      PropertyVerification.countDocuments(),
      Case.countDocuments(),
      Certificate.countDocuments()
    ]);
    
    console.log('\n📊 CURRENT DATABASE STATE:');
    console.log(`Users: ${userCount}`);
    console.log(`Properties: ${propertyCount}`);
    console.log(`Verifications: ${verificationCount}`);
    console.log(`Cases: ${caseCount}`);
    console.log(`Certificates: ${certificateCount}`);
    
    if (userCount === 0 && propertyCount === 0 && verificationCount === 0 && caseCount === 0 && certificateCount === 0) {
      console.log('\n✅ Database is already empty!');
      return;
    }
    
    console.log('\n⚠️  WARNING: This will remove ALL data from the database!');
    
    // Remove all data
    console.log('\n🚀 STARTING DATABASE RESET...');
    
    const [userResult, propertyResult, verificationResult, caseResult, certificateResult] = await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      PropertyVerification.deleteMany({}),
      Case.deleteMany({}),
      Certificate.deleteMany({})
    ]);
    
    console.log('\n📊 RESET RESULTS:');
    console.log(`✅ Users removed: ${userResult.deletedCount}`);
    console.log(`✅ Properties removed: ${propertyResult.deletedCount}`);
    console.log(`✅ Verifications removed: ${verificationResult.deletedCount}`);
    console.log(`✅ Cases removed: ${caseResult.deletedCount}`);
    console.log(`✅ Certificates removed: ${certificateResult.deletedCount}`);
    
    const totalRemoved = userResult.deletedCount + propertyResult.deletedCount + 
                        verificationResult.deletedCount + caseResult.deletedCount + 
                        certificateResult.deletedCount;
    console.log(`\n🗑️ TOTAL RECORDS REMOVED: ${totalRemoved}`);
    
    console.log('\n✅ DATABASE RESET COMPLETED! Ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
  }
}

async function main() {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    await resetDatabase();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔄 Bhoomi Setu Database Reset Script

Usage: 
  node reset-database.js

This script will completely reset the database by removing:
- All users
- All properties  
- All property verifications
- All cases
- All certificates

Use this when you need a clean database for fresh testing or production setup.
  `);
  process.exit(0);
}

main().catch(console.error);