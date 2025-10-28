const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu');

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

async function checkProperties() {
  try {
    console.log('🔍 Checking properties in database...');

    const properties = await Property.find({});
    
    console.log(`Found ${properties.length} total properties:`);
    
    properties.forEach((property, index) => {
      console.log(`\n${index + 1}. ${property.surveyId}`);
      console.log(`   ID: ${property._id}`);
      console.log(`   landId: ${property.landId}`);
      console.log(`   Price: ${property.priceInWei} wei`);
      console.log(`   Owner: ${property.ownerAddress}`);
      console.log(`   For Sale: ${property.forSale}`);
    });

    // Check for properties without landId
    const withoutLandId = properties.filter(p => !p.landId || typeof p.landId !== 'number');
    console.log(`\n⚠️  Properties without valid landId: ${withoutLandId.length}`);
    
    if (withoutLandId.length > 0) {
      console.log('These properties will cause the BigNumberish error:');
      withoutLandId.forEach(p => {
        console.log(`- ${p.surveyId} (ID: ${p._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking properties:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkProperties();