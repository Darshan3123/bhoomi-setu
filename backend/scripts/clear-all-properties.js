const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bhoomi-setu', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Property schema (simplified)
const PropertySchema = new mongoose.Schema({
  surveyId: String,
  landId: Number,
}, { timestamps: true });

const Property = mongoose.model('Property', PropertySchema);

async function clearAllProperties() {
  try {
    console.log('🗑️  Clearing all properties from database...');

    // Count existing properties
    const count = await Property.countDocuments();
    console.log(`📊 Found ${count} properties to remove`);

    if (count === 0) {
      console.log('✅ No properties found. Database is already clean.');
      return;
    }

    // Show properties before deletion
    const properties = await Property.find({});
    console.log('\n📋 Properties to be removed:');
    properties.forEach((property, index) => {
      console.log(`${index + 1}. ${property.surveyId} (landId: ${property.landId || 'N/A'})`);
    });

    // Confirm deletion
    console.log('\n⚠️  This will permanently delete ALL properties!');
    
    // Delete all properties
    const result = await Property.deleteMany({});
    
    console.log(`\n✅ Successfully removed ${result.deletedCount} properties`);
    console.log('🎉 Database is now clean - no properties remain');

    // Verify deletion
    const remainingCount = await Property.countDocuments();
    console.log(`📊 Remaining properties: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error clearing properties:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearAllProperties();