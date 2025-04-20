const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const TestSeries = require('../models/TestSeries');
const Test = require('../models/Test');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function fixTestSeries() {
  try {
    console.log('Starting to fix test series...');
    
    // Get the specific test series by ID
    const seriesId = '68045d31976e4479eca44b39';
    const testSeries = await TestSeries.findById(seriesId);
    
    if (!testSeries) {
      console.error(`Test series with ID ${seriesId} not found`);
      process.exit(1);
    }
    
    console.log(`Found test series: ${testSeries.title}`);
    
    // Find all tests associated with this series
    const associatedTests = await Test.find({
      isSeriesTest: true,
      seriesId: seriesId
    });
    
    console.log(`Found ${associatedTests.length} tests associated with this series`);
    
    if (associatedTests.length === 0) {
      console.log('No tests found for this series. Nothing to fix.');
      process.exit(0);
    }
    
    // Get test IDs - directly use the _id objects (don't convert them)
    const testIds = associatedTests.map(test => test._id);
    console.log('Test IDs:', testIds);
    
    // Use direct MongoDB update to avoid pre-save hook issues
    const updateResult = await TestSeries.updateOne(
      { _id: seriesId },
      { 
        $set: { 
          tests: testIds,
          totalTests: testIds.length 
        } 
      }
    );
    
    console.log('Update result:', updateResult);
    console.log(`Updated test series with ${testIds.length} tests`);
    console.log('Fix completed successfully!');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing test series:', error);
    process.exit(1);
  }
}

// Run the function
fixTestSeries(); 