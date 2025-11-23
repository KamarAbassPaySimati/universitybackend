const mongoose = require('mongoose');
const functions = require('firebase-functions');

const connectDB = async () => {
  try {
    const mongoUri = functions.config().mongodb?.uri || process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB database');
    } else {
      console.log('⚠️ MongoDB URI not found, skipping database connection');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Continuing without database connection');
  }
};

connectDB();

module.exports = mongoose;