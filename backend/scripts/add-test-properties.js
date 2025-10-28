const mongoose = require('mongoose');
const { ethers } = require('ethers');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Property schema (simplified)
const PropertySchema = new mongoose.Schema({
  surveyId: String,
  location: String,
  propertyType: String,
  area: Number,
  areaUnit: String,
  priceInWei: String,
  priceInINR: Number,
  owner: mongoose.Types.ObjectId,
  ownerAddress: String,
  forSale: Boolean,
  status: String,
  documentHashes: [String],
  hasDocuments: {
    saleDeed: Boolean,
    taxReceipt: Boolean,
    noc: Boolean,
    propertyPhoto: Boolean,
  },
  landId: Number,
}, { timestamps: true });

const Property = mongoose.model('Property', PropertySchema);

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

async function addTestProperties() {
  try {
    console.log('🏠 Adding test properties...');

    // Create a test user (property owner)
    const testUser = await User.findOneAndUpdate(
      { walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' },
      {
        walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        role: 'user',
        profile: {
          name: 'Test Property Owner',
          email: 'owner@test.com',
          phone: '+1234567890'
        }
      },
      { upsert: true, new: true }
    );

    console.log('👤 Test user created:', testUser.walletAddress);

    // Test properties data
    const testProperties = [
      {
        surveyId: 'DAR-2001-111',
        location: '23 Shastri Nagar, Ahmedabad, Gujarat',
        propertyType: 'Commercial',
        area: 1500,
        areaUnit: 'sq ft',
        priceInWei: ethers.parseEther('0.5').toString(), // 0.5 ETH
        priceInINR: 250000,
        landId: 1
      },
      {
        surveyId: 'PROP-321-FX',
        location: 'B-301, Satellite Heights, Ahmedabad, Gujarat',
        propertyType: 'Residential',
        area: 250,
        areaUnit: 'sq ft',
        priceInWei: ethers.parseEther('0.3').toString(), // 0.3 ETH
        priceInINR: 150000,
        landId: 2
      },
      {
        surveyId: 'KHI-123-KR',
        location: 'Plot 45, Industrial Area, Rajkot, Gujarat',
        propertyType: 'Commercial',
        area: 500,
        areaUnit: 'sq ft',
        priceInWei: ethers.parseEther('2.5').toString(), // 2.5 ETH
        priceInINR: 1250000,
        landId: 3
      },
      {
        surveyId: 'KUE-2340-123',
        location: 'Village Kheda, Anand District, Gujarat',
        propertyType: 'Agricultural',
        area: 200,
        areaUnit: 'sq ft',
        priceInWei: ethers.parseEther('1.0').toString(), // 1.0 ETH
        priceInINR: 500000,
        landId: 4
      }
    ];

    // Add properties
    for (const propData of testProperties) {
      const property = await Property.findOneAndUpdate(
        { surveyId: propData.surveyId },
        {
          ...propData,
          owner: testUser._id,
          ownerAddress: testUser.walletAddress,
          forSale: true,
          status: 'active',
          documentHashes: ['QmTestHash1', 'QmTestHash2', 'QmTestHash3', 'QmTestHash4'],
          hasDocuments: {
            saleDeed: true,
            taxReceipt: true,
            noc: true,
            propertyPhoto: true,
          }
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Property added: ${property.surveyId} - ${ethers.formatEther(property.priceInWei)} ETH`);
    }

    console.log('🎉 Test properties added successfully!');
    console.log('💡 You can now test the Buy Now functionality on the marketplace');

  } catch (error) {
    console.error('❌ Error adding test properties:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestProperties();