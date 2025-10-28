import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bhoomi-setu';
    
    console.log('🔄 Attempting to connect to MongoDB:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options to handle timeouts and retries
      serverSelectionTimeoutMS: 10000, // Reduce timeout to 10 seconds
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Make sure MongoDB is running: net start MongoDB');
    console.error('   2. Check if port 27017 is available');
    console.error('   3. Try connecting with MongoDB Compass to test');
    console.error('   4. Consider using MongoDB Atlas for cloud database');
    throw error; // Don't exit, let the caller handle it
  }
};

export default connectDB;