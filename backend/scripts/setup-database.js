#!/usr/bin/env node

/**
 * Database Setup Script for Bhoomi Setu
 * 
 * This script sets up the complete database with sample data for development
 * Run with: node backend/scripts/setup-database.js
 * 
 * Features:
 * - Creates all collections with proper indexes
 * - Adds sample users (admin, inspector, regular users)
 * - Creates sample properties with different statuses
 * - Sets up property verifications
 * - Creates sample cases and certificates
 * - Adds sample transactions for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');

// Import models
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const PropertyVerification = require('../src/models/PropertyVerification');
const Case = require('../src/models/Case');
const Certificate = require('../src/models/Certificate');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Sample data configuration
const SAMPLE_DATA = {
  users: [
    {
      walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      role: 'admin',
      profile: {
        name: 'Admin User',
        email: 'admin@bhoomisetu.com',
        phone: '+91-9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        kycDocuments: {
          verified: true,
          aadhaar: 'QmSampleAadhaarHash1234567890123456789012',
          pan: 'QmSamplePANHash1234567890123456789012345'
        }
      }
    },
    {
      walletAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      role: 'inspector',
      profile: {
        name: 'Inspector Kumar',
        email: 'inspector@bhoomisetu.com',
        phone: '+91-9876543211',
        aadhaarNumber: '123456789013',
        panNumber: 'ABCDE1234G',
        kycDocuments: {
          verified: true,
          aadhaar: 'QmSampleAadhaarHash1234567890123456789013',
          pan: 'QmSamplePANHash1234567890123456789013456'
        }
      }
    },
    {
      walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      role: 'user',
      profile: {
        name: 'Rajesh Sharma',
        email: 'rajesh@example.com',
        phone: '+91-9876543212',
        aadhaarNumber: '123456789014',
        panNumber: 'ABCDE1234H',
        kycDocuments: {
          verified: true,
          aadhaar: 'QmSampleAadhaarHash1234567890123456789014',
          pan: 'QmSamplePANHash1234567890123456789014567'
        }
      }
    },
    {
      walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
      role: 'user',
      profile: {
        name: 'Priya Patel',
        email: 'priya@example.com',
        phone: '+91-9876543213',
        aadhaarNumber: '123456789015',
        panNumber: 'ABCDE1234I',
        kycDocuments: {
          verified: false,
          aadhaar: 'QmSampleAadhaarHash1234567890123456789015',
          pan: 'QmSamplePANHash1234567890123456789015678'
        }
      }
    },
    {
      walletAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      role: 'user',
      profile: {
        name: 'Amit Singh',
        email: 'amit@example.com',
        phone: '+91-9876543214',
        aadhaarNumber: '123456789016',
        panNumber: 'ABCDE1234J',
        kycDocuments: {
          verified: true,
          aadhaar: 'QmSampleAadhaarHash1234567890123456789016',
          pan: 'QmSamplePANHash1234567890123456789016789'
        }
      }
    }
  ],
  
  properties: [
    {
      surveyId: 'PROP001',
      location: 'Sector 15, Gurgaon, Haryana',
      propertyType: 'Residential',
      area: 1200,
      areaUnit: 'sq ft',
      priceInWei: ethers.parseEther('2.5').toString(),
      priceInINR: 2500000,
      ownerAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      forSale: true,
      status: 'active',
      documentHashes: [
        'QmSampleDoc1Hash1234567890123456789012345',
        'QmSampleDoc2Hash1234567890123456789012346',
        'QmSampleDoc3Hash1234567890123456789012347'
      ],
      hasDocuments: {
        saleDeed: true,
        taxReceipt: true,
        noc: true,
        propertyPhoto: true
      },
      blockchainTxHash: '0x9cb9c21bf4db551b1545334ad018ab69da19fe9abaff290be7af0ad13bfa02cb'
    },
    {
      surveyId: 'PROP002',
      location: 'MG Road, Bangalore, Karnataka',
      propertyType: 'Commercial',
      area: 2500,
      areaUnit: 'sq ft',
      priceInWei: ethers.parseEther('5.0').toString(),
      priceInINR: 5000000,
      ownerAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      forSale: false,
      status: 'active',
      documentHashes: [
        'QmSampleDoc4Hash1234567890123456789012348',
        'QmSampleDoc5Hash1234567890123456789012349'
      ],
      hasDocuments: {
        saleDeed: true,
        taxReceipt: true,
        noc: false,
        propertyPhoto: true
      },
      blockchainTxHash: '0x89d6ba0b0e109e142e8afdc93490aebec6a2b58747f23d9179e0584c2ea53794'
    },
    {
      surveyId: 'PROP003',
      location: 'Village Kharkhoda, Sonipat, Haryana',
      propertyType: 'Agricultural',
      area: 5,
      areaUnit: 'acre',
      priceInWei: ethers.parseEther('1.8').toString(),
      priceInINR: 1800000,
      ownerAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
      forSale: true,
      status: 'active',
      documentHashes: [
        'QmSampleDoc6Hash1234567890123456789012350'
      ],
      hasDocuments: {
        saleDeed: true,
        taxReceipt: false,
        noc: false,
        propertyPhoto: true
      }
    }
  ],

  sampleTransactions: [
    {
      hash: '0x9cb9c21bf4db551b1545334ad018ab69da19fe9abaff290be7af0ad13bfa02cb',
      from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      to: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      value: '1.53',
      propertyId: 'PROP001',
      type: 'property_transfer'
    },
    {
      hash: '0x89d6ba0b0e109e142e8afdc93490aebec6a2b58747f23d9179e0584c2ea53794',
      from: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      to: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      value: '0.0',
      propertyId: 'PROP002',
      type: 'property_verification'
    }
  ]
};

// Utility functions
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Database connection
async function connectDatabase() {
  try {
    logStep('1', 'Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logSuccess(`Connected to MongoDB: ${MONGODB_URI}`);
    return true;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
}

// Clear existing data
async function clearDatabase() {
  try {
    logStep('2', 'Clearing existing data...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    for (const collectionName of collectionNames) {
      await mongoose.connection.db.collection(collectionName).deleteMany({});
      log(`   Cleared collection: ${collectionName}`, 'yellow');
    }
    
    logSuccess('Database cleared successfully');
    return true;
  } catch (error) {
    logError(`Failed to clear database: ${error.message}`);
    return false;
  }
}

// Create indexes
async function createIndexes() {
  try {
    logStep('3', 'Creating database indexes...');
    
    // User indexes
    await User.createIndexes();
    log('   Created User indexes', 'blue');
    
    // Property indexes
    await Property.createIndexes();
    log('   Created Property indexes', 'blue');
    
    // PropertyVerification indexes (if model exists)
    try {
      await PropertyVerification.createIndexes();
      log('   Created PropertyVerification indexes', 'blue');
    } catch (e) {
      logWarning('PropertyVerification model not found, skipping indexes');
    }
    
    // Case indexes (if model exists)
    try {
      await Case.createIndexes();
      log('   Created Case indexes', 'blue');
    } catch (e) {
      logWarning('Case model not found, skipping indexes');
    }
    
    // Certificate indexes (if model exists)
    try {
      await Certificate.createIndexes();
      log('   Created Certificate indexes', 'blue');
    } catch (e) {
      logWarning('Certificate model not found, skipping indexes');
    }
    
    logSuccess('Database indexes created successfully');
    return true;
  } catch (error) {
    logError(`Failed to create indexes: ${error.message}`);
    return false;
  }
}

// Create sample users
async function createSampleUsers() {
  try {
    logStep('4', 'Creating sample users...');
    
    const users = [];
    for (const userData of SAMPLE_DATA.users) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      log(`   Created ${userData.role}: ${userData.profile.name} (${userData.walletAddress})`, 'blue');
    }
    
    logSuccess(`Created ${users.length} sample users`);
    return users;
  } catch (error) {
    logError(`Failed to create sample users: ${error.message}`);
    return [];
  }
}

// Create sample properties
async function createSampleProperties(users) {
  try {
    logStep('5', 'Creating sample properties...');
    
    const properties = [];
    for (const propertyData of SAMPLE_DATA.properties) {
      // Find the owner user
      const owner = users.find(u => u.walletAddress === propertyData.ownerAddress);
      if (owner) {
        propertyData.owner = owner._id;
      }
      
      const property = new Property(propertyData);
      await property.save();
      properties.push(property);
      log(`   Created property: ${propertyData.surveyId} - ${propertyData.location}`, 'blue');
    }
    
    logSuccess(`Created ${properties.length} sample properties`);
    return properties;
  } catch (error) {
    logError(`Failed to create sample properties: ${error.message}`);
    return [];
  }
}

// Create sample property verifications
async function createSampleVerifications(properties, users) {
  try {
    logStep('6', 'Creating sample property verifications...');
    
    if (!PropertyVerification) {
      logWarning('PropertyVerification model not available, skipping...');
      return [];
    }
    
    const verifications = [];
    const inspector = users.find(u => u.role === 'inspector');
    
    for (let i = 0; i < Math.min(2, properties.length); i++) {
      const property = properties[i];
      const owner = users.find(u => u._id.equals(property.owner));
      
      const verification = new PropertyVerification({
        verificationId: i + 1,
        propertyId: property.surveyId,
        ownerAddress: property.ownerAddress,
        inspectorAddress: inspector ? inspector.walletAddress : null,
        status: i === 0 ? 'verified' : 'pending',
        propertyDetails: {
          surveyNumber: property.surveyId,
          location: property.location,
          area: property.area,
          areaUnit: property.areaUnit,
          propertyType: property.propertyType,
          ownerName: owner ? owner.profile.name : 'Unknown'
        },
        documents: [
          {
            type: 'property_deed',
            ipfsHash: 'QmSampleVerificationDoc' + (i + 1),
            uploadedAt: new Date()
          }
        ]
      });
      
      await verification.save();
      verifications.push(verification);
      log(`   Created verification for: ${property.surveyId}`, 'blue');
    }
    
    logSuccess(`Created ${verifications.length} sample verifications`);
    return verifications;
  } catch (error) {
    logError(`Failed to create sample verifications: ${error.message}`);
    return [];
  }
}

// Create sample cases
async function createSampleCases(properties, users) {
  try {
    logStep('7', 'Creating sample cases...');
    
    if (!Case) {
      logWarning('Case model not available, skipping...');
      return [];
    }
    
    const cases = [];
    const inspector = users.find(u => u.role === 'inspector');
    
    if (properties.length >= 2) {
      const caseData = {
        requestId: 1,
        landId: 1,
        fromAddress: properties[0].ownerAddress,
        toAddress: properties[1].ownerAddress,
        inspectorAddress: inspector ? inspector.walletAddress : null,
        status: 'pending',
        documents: [
          {
            type: 'property_deed',
            ipfsHash: 'QmSampleCaseDoc1',
            uploadedAt: new Date()
          }
        ]
      };
      
      const caseRecord = new Case(caseData);
      await caseRecord.save();
      cases.push(caseRecord);
      log(`   Created transfer case: ${caseData.requestId}`, 'blue');
    }
    
    logSuccess(`Created ${cases.length} sample cases`);
    return cases;
  } catch (error) {
    logError(`Failed to create sample cases: ${error.message}`);
    return [];
  }
}

// Create sample certificates
async function createSampleCertificates(properties, users) {
  try {
    logStep('8', 'Creating sample certificates...');
    
    if (!Certificate) {
      logWarning('Certificate model not available, skipping...');
      return [];
    }
    
    const certificates = [];
    
    for (let i = 0; i < Math.min(2, properties.length); i++) {
      const property = properties[i];
      const owner = users.find(u => u._id.equals(property.owner));
      
      if (property.blockchainTxHash) {
        const certificate = new Certificate({
          landId: i + 1,
          ownerAddress: property.ownerAddress,
          certificateHash: `QmSampleCertificate${i + 1}Hash`,
          blockchainTxHash: property.blockchainTxHash,
          issuedAt: new Date(),
          metadata: {
            landArea: `${property.area} ${property.areaUnit}`,
            location: property.location,
            surveyNumber: property.surveyId,
            registrationDate: new Date(),
            previousOwner: i > 0 ? properties[0].ownerAddress : null
          }
        });
        
        await certificate.save();
        certificates.push(certificate);
        log(`   Created certificate for: ${property.surveyId}`, 'blue');
      }
    }
    
    logSuccess(`Created ${certificates.length} sample certificates`);
    return certificates;
  } catch (error) {
    logError(`Failed to create sample certificates: ${error.message}`);
    return [];
  }
}

// Display summary
function displaySummary(users, properties, verifications, cases, certificates) {
  log('\n' + '='.repeat(60), 'bright');
  log('DATABASE SETUP COMPLETE', 'bright');
  log('='.repeat(60), 'bright');
  
  log('\n📊 SUMMARY:', 'cyan');
  log(`   Users: ${users.length}`, 'green');
  log(`   Properties: ${properties.length}`, 'green');
  log(`   Verifications: ${verifications.length}`, 'green');
  log(`   Cases: ${cases.length}`, 'green');
  log(`   Certificates: ${certificates.length}`, 'green');
  
  log('\n👥 SAMPLE USERS:', 'cyan');
  users.forEach(user => {
    log(`   ${user.role.toUpperCase()}: ${user.profile.name}`, 'blue');
    log(`   Wallet: ${user.walletAddress}`, 'magenta');
    log(`   Email: ${user.profile.email}`, 'yellow');
    log('');
  });
  
  log('🏠 SAMPLE PROPERTIES:', 'cyan');
  properties.forEach(property => {
    log(`   ${property.surveyId}: ${property.location}`, 'blue');
    log(`   Type: ${property.propertyType}, Area: ${property.area} ${property.areaUnit}`, 'yellow');
    log(`   Owner: ${property.ownerAddress}`, 'magenta');
    if (property.blockchainTxHash) {
      log(`   Transaction: ${property.blockchainTxHash}`, 'green');
    }
    log('');
  });
  
  log('🔗 SAMPLE TRANSACTIONS:', 'cyan');
  SAMPLE_DATA.sampleTransactions.forEach(tx => {
    log(`   Hash: ${tx.hash}`, 'blue');
    log(`   From: ${tx.from}`, 'yellow');
    log(`   To: ${tx.to}`, 'yellow');
    log(`   Value: ${tx.value} ETH`, 'green');
    log(`   Type: ${tx.type}`, 'magenta');
    log('');
  });
  
  log('🚀 NEXT STEPS:', 'cyan');
  log('   1. Start your backend server: npm run dev', 'yellow');
  log('   2. Start your frontend server: npm run dev', 'yellow');
  log('   3. Visit http://localhost:3000 to see the application', 'yellow');
  log('   4. Test transaction details at: http://localhost:3000/test-transaction', 'yellow');
  log('   5. Login with any of the sample wallet addresses above', 'yellow');
  
  log('\n' + '='.repeat(60), 'bright');
}

// Main setup function
async function setupDatabase() {
  try {
    log('🚀 BHOOMI SETU DATABASE SETUP', 'bright');
    log('Environment: ' + NODE_ENV, 'yellow');
    log('MongoDB URI: ' + MONGODB_URI, 'yellow');
    log('');
    
    // Connect to database
    const connected = await connectDatabase();
    if (!connected) return;
    
    // Clear existing data
    const cleared = await clearDatabase();
    if (!cleared) return;
    
    // Create indexes
    const indexesCreated = await createIndexes();
    if (!indexesCreated) return;
    
    // Create sample data
    const users = await createSampleUsers();
    const properties = await createSampleProperties(users);
    const verifications = await createSampleVerifications(properties, users);
    const cases = await createSampleCases(properties, users);
    const certificates = await createSampleCertificates(properties, users);
    
    // Display summary
    displaySummary(users, properties, verifications, cases, certificates);
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log('\n🔌 Database connection closed', 'yellow');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  SAMPLE_DATA,
  connectDatabase,
  clearDatabase,
  createIndexes
};