const mongoose = require('mongoose');
const User = require('../models/User');
const TestSeries = require('../models/TestSeries');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://satish151104:c3jKc57T74XdJKne@cluster0.ruzmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkDBConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });
    console.log('Successfully connected to MongoDB!');
    
    // Check if users collection exists and has documents
    console.log('\nChecking users collection...');
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in the database`);
    
    if (userCount > 0) {
      // Get a sample user
      const sampleUser = await User.findOne().select('firebaseId email name role');
      console.log('Sample user:', sampleUser);
      
      // Try to find a specific user
      const specificUser = await User.findOne({ firebaseId: 'shdjxWo1rcWwfGxbgReD7fOWMV52' });
      if (specificUser) {
        console.log('\nFound specific user:', {
          id: specificUser._id,
          firebaseId: specificUser.firebaseId,
          email: specificUser.email,
          name: specificUser.name,
          role: specificUser.role,
          hasPreferences: !!specificUser.preferences
        });
      } else {
        console.log('\nSpecific user not found with firebaseId: shdjxWo1rcWwfGxbgReD7fOWMV52');
      }
    }
    
    // Check test series collection
    console.log('\nChecking test series collection...');
    const seriesCount = await TestSeries.countDocuments();
    console.log(`Found ${seriesCount} test series in the database`);
    
    if (seriesCount > 0) {
      const sampleSeries = await TestSeries.findOne().select('title description category');
      console.log('Sample test series:', sampleSeries);
    }
    
    console.log('\nDatabase check completed successfully');
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkDBConnection(); 