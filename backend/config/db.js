const mongoose = require('mongoose');

const connectDB = async () => {
  const atlasUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/connecthub';
  
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  };

  try {
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(atlasUri, options);
    console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Atlas Connection Failed: ${error.message}`);
    console.log('IP whitelist block or network block detected.');
    console.log('Attempting to connect to local MongoDB database instead...');
    
    try {
      const conn = await mongoose.connect(localUri, options);
      console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
    } catch (localError) {
      console.error(`\n❌ Local MongoDB Connection Failed: ${localError.message}`);
      console.error('\n========================================================================');
      console.error('🔴 DATABASE CONNECTION ERROR:');
      console.error('Could not establish connection to either MongoDB Atlas or Local MongoDB.');
      console.error('========================================================================');
      console.error('How to resolve this issue:');
      console.error('1. MongoDB Atlas (Cloud):');
      console.error('   - Log into your MongoDB Atlas Dashboard (https://cloud.mongodb.com).');
      console.error('   - Go to "Network Access" under the Security section in the left sidebar.');
      console.error('   - Verify that your current IP address is whitelisted, or add "0.0.0.0/0"');
      console.error('     to temporarily allow access from anywhere for development/testing.');
      console.error('2. Local MongoDB:');
      console.error('   - Check if the local MongoDB service is installed and running on your PC.');
      console.error('   - Ensure local MongoDB is listening on mongodb://127.0.0.1:27017.');
      console.error('========================================================================\n');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
