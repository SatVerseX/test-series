require('dotenv').config();
const mongoose = require('mongoose');

async function dropPhoneNumberIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Dropping phoneNumber index...');
    await mongoose.connection.collection('users').dropIndex('phoneNumber_1');
    console.log('Index dropped successfully');

    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropPhoneNumberIndex(); 