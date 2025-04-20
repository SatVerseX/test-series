// Direct MongoDB update script
// Run with: node backend/directUpdate.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Test Attempt details
const TEST_ATTEMPT_ID = '68052fa49f3564a83d8245ba';

async function directUpdate() {
  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB URI not found in environment variables');
    return;
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Select database and collection
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    const testAttemptsCollection = db.collection('testattempts');
    
    console.log(`Using database: ${dbName}`);
    console.log(`Updating test attempt: ${TEST_ATTEMPT_ID}`);

    // 1. Update status to completed
    const statusResult = await testAttemptsCollection.updateOne(
      { _id: new ObjectId(TEST_ATTEMPT_ID) },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date()
        }
      }
    );
    
    console.log(`Status update result: ${statusResult.modifiedCount} document(s) modified`);

    // 2. Get the updated document to verify
    const updatedAttempt = await testAttemptsCollection.findOne({ _id: new ObjectId(TEST_ATTEMPT_ID) });
    console.log('Updated attempt:', updatedAttempt);

    console.log('\nFIX COMPLETE: The test attempt status has been updated to "completed".');
    console.log('Now you can view the test result in the UI, which should calculate the proper score.');
    console.log('If you still see issues, use the manual score update endpoint in the API.');

  } catch (error) {
    console.error('Error updating test attempt:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

directUpdate().catch(console.error); 