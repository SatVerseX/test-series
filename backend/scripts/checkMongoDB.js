require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if the users collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollection = collections.find(c => c.name === 'users');
    
    if (!userCollection) {
      console.log('Users collection does not exist');
      return;
    }
    
    console.log('Users collection exists');
    
    // Get all indexes on the users collection
    const indexes = await mongoose.connection.collection('users').indexes();
    console.log('Indexes on users collection:');
    indexes.forEach(index => {
      console.log(JSON.stringify(index, null, 2));
    });
    
    // Check if there are any users in the collection
    const userCount = await mongoose.connection.collection('users').countDocuments();
    console.log(`Number of users in collection: ${userCount}`);
    
    // Check for users with null phoneNumber
    const nullPhoneCount = await mongoose.connection.collection('users').countDocuments({ phoneNumber: null });
    console.log(`Number of users with null phoneNumber: ${nullPhoneCount}`);
    
    // Check for users with the same email
    const emailCounts = await mongoose.connection.collection('users').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (emailCounts.length > 0) {
      console.log('Duplicate emails found:');
      emailCounts.forEach(item => {
        console.log(`Email: ${item._id}, Count: ${item.count}`);
      });
    } else {
      console.log('No duplicate emails found');
    }
    
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMongoDB(); 