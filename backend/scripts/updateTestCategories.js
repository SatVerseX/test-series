require('dotenv').config();
const mongoose = require('mongoose');
const { DEFAULT_CATEGORIES } = require('../data/defaultCategories');

// Mongoose model of Test (simplified for this script)
const TestSchema = new mongoose.Schema({
  title: String,
  subject: String,
  category: String
});

const Test = mongoose.model('Test', TestSchema, 'tests');

async function updateTestCategories() {
  try {
    console.log('Connecting to MongoDB...');
    // Use the connection string from server.js
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://satish151104:c3jKc57T74XdJKne@cluster0.ruzmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all tests
    const tests = await Test.find({});
    console.log(`Found ${tests.length} tests`);

    // Extract category names from DEFAULT_CATEGORIES
    const standardCategories = DEFAULT_CATEGORIES.map(cat => cat.name);
    console.log('Standard categories:', standardCategories);

    // Update each test with a standard category
    let updatedCount = 0;
    
    for (const test of tests) {
      // Assign a random standard category (for simplicity)
      // In a real scenario, you might want to map based on subject or other criteria
      const randomIndex = Math.floor(Math.random() * standardCategories.length);
      test.category = standardCategories[randomIndex];
      await test.save();
      updatedCount++;
      console.log(`Updated test: ${test.title} - Category: ${test.category}`);
    }

    console.log(`Updated ${updatedCount} tests with standard categories`);
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTestCategories(); 