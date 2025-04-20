const express = require('express');
const router = express.Router();
const TestSeries = require('../models/TestSeries');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { verifyToken, isAdmin, isTeacher } = require('../middleware/auth');
const Test = require('../models/Test');
const mongoose = require('mongoose');

// Get all test series (public)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all test series with query:', req.query);
    const { category, search, paid, popular } = req.query;
    let query = { active: true };
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by paid/free status
    if (paid === 'true') {
      query.isPaid = true;
    } else if (paid === 'false') {
      query.isPaid = false;
    }
    
    // Filter by popularity
    if (popular === 'true') {
      query.popular = true;
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('MongoDB query:', JSON.stringify(query));
    const testSeries = await TestSeries.find(query)
      .populate('tests', 'title description duration status')
      .select('title description category isPaid price discount totalTests duration rating students popular imageUrl tests')
      .sort({ popular: -1, students: -1 });
    
    console.log(`Found ${testSeries.length} test series`);
    res.json(testSeries);
  } catch (err) {
    console.error('Error fetching test series:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({ error: 'Failed to fetch test series', details: err.message });
  }
});

// Get test series by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id)
      .populate({
        path: 'tests',
        select: 'title description duration status grade subject totalMarks totalQuestions isPaid price'
      });
    
    if (!testSeries) {
      return res.status(404).json({ error: 'Test series not found' });
    }
    
    // If we find the series but tests array is empty, double-check tests collection
    if ((!testSeries.tests || testSeries.tests.length === 0) && testSeries._id) {
      console.log(`Test series ${testSeries._id} found with empty tests array, checking for associated tests`);
      
      // Find any tests that are associated with this series
      const associatedTests = await Test.find({
        isSeriesTest: true,
        seriesId: testSeries._id
      }).select('_id title description duration status grade subject totalMarks totalQuestions isPaid price');
      
      if (associatedTests && associatedTests.length > 0) {
        console.log(`Found ${associatedTests.length} associated tests that weren't in the series tests array`);
        
        // Update the test series with these tests
        testSeries.tests = associatedTests.map(test => test._id);
        testSeries.totalTests = associatedTests.length;
        
        // Save the updated test series
        await testSeries.save();
        
        // Return the updated series with populated tests
        const updatedSeries = await TestSeries.findById(req.params.id)
          .populate({
            path: 'tests',
            select: 'title description duration status grade subject totalMarks totalQuestions isPaid price'
          });
        
        return res.json(updatedSeries);
      }
    }
    
    res.json(testSeries);
  } catch (err) {
    console.error('Error fetching test series:', err);
    res.status(500).json({ error: 'Failed to fetch test series' });
  }
});

// Create new test series (admin/teacher only)
router.post('/', verifyToken, isTeacher, async (req, res) => {
  try {
    const {
      title,
      description,
      longDescription,
      category,
      isPaid,
      price,
      discount,
      duration,
      features,
      tests,
      imageUrl
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate price for paid test series
    if (isPaid && (!price || price <= 0)) {
      return res.status(400).json({ error: 'Price is required for paid test series' });
    }
    
    // Create test series
    const testSeries = new TestSeries({
      title,
      description,
      longDescription,
      category,
      isPaid: isPaid || false,
      price: price || 0,
      discount: discount || 0,
      duration: duration || 'Unlimited',
      totalTests: tests ? tests.length : 0,
      features: features || [],
      tests: tests || [],
      createdBy: req.user._id,
      imageUrl: imageUrl || ''
    });
    
    await testSeries.save();
    
    res.status(201).json(testSeries);
  } catch (err) {
    console.error('Error creating test series:', err);
    res.status(500).json({ error: 'Failed to create test series' });
  }
});

// Update test series (admin/teacher only)
router.put('/:id', verifyToken, isTeacher, async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);
    
    if (!testSeries) {
      return res.status(404).json({ error: 'Test series not found' });
    }
    
    // Verify ownership or admin status
    if (!req.user.isAdmin() && testSeries.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this test series' });
    }
    
    // Update fields
    const updates = req.body;
    
    // Special handling for tests array
    if (updates.tests) {
      console.log('Updating tests array:', updates.tests);
      
      // Ensure all test IDs are valid ObjectIds
      try {
        updates.tests = updates.tests.map(testId => {
          if (typeof testId === 'string') {
            return mongoose.Types.ObjectId(testId);
          }
          return testId;
        });
      } catch (idError) {
        console.error('Error converting test IDs to ObjectIds:', idError);
        return res.status(400).json({ error: 'Invalid test ID format in the tests array' });
      }
      
      // Calculate totalTests from the tests array
      updates.totalTests = updates.tests.length;
      console.log(`Setting totalTests to ${updates.totalTests}`);
    }
    
    // Update test series
    Object.keys(updates).forEach(key => {
      testSeries[key] = updates[key];
    });
    
    await testSeries.save();
    
    // Fetch the updated document with populated tests
    const updatedSeries = await TestSeries.findById(req.params.id)
      .populate('tests', 'title description duration status');
    
    res.json(updatedSeries);
  } catch (err) {
    console.error('Error updating test series:', err);
    res.status(500).json({ error: 'Failed to update test series' });
  }
});

// Delete test series (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);
    
    if (!testSeries) {
      return res.status(404).json({ error: 'Test series not found' });
    }
    
    await TestSeries.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Test series deleted successfully' });
  } catch (err) {
    console.error('Error deleting test series:', err);
    res.status(500).json({ error: 'Failed to delete test series' });
  }
});

// Get purchased test series for user
router.get('/user/purchased', verifyToken, async (req, res) => {
  try {
    // Find user with populated purchasedSeries
    const user = await User.findById(req.user._id)
      .populate({
        path: 'purchasedSeries.seriesId',
        select: 'title description category isPaid price discount totalTests duration rating students popular imageUrl'
      });
    
    // Filter valid purchases (not expired)
    const validPurchases = user.purchasedSeries.filter(purchase => {
      return !purchase.expiresAt || new Date() < purchase.expiresAt;
    });
    
    // Map to return only the series data with purchase info
    const purchasedSeries = validPurchases.map(purchase => {
      return {
        ...purchase.seriesId.toObject(),
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt,
        progress: purchase.progress
      };
    });
    
    res.json(purchasedSeries);
  } catch (err) {
    console.error('Error fetching purchased test series:', err);
    res.status(500).json({ error: 'Failed to fetch purchased test series' });
  }
});

// Check if user has purchased a specific test series
router.get('/:id/check-purchase', verifyToken, async (req, res) => {
  try {
    const seriesId = req.params.id;
    const userId = req.user._id;
    
    // Method 1: Check in Purchase model
    const purchase = await Purchase.findOne({
      user: userId,
      testSeries: seriesId,
      status: 'completed',
      accessGranted: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    // Method 2: Check in User model
    const user = await User.findById(userId);
    const hasPurchased = user.hasPurchased(seriesId);
    
    res.json({ 
      hasPurchased: !!purchase || hasPurchased,
      purchaseDetails: purchase
    });
  } catch (err) {
    console.error('Error checking purchase status:', err);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

// Get all tests for a test series
router.get('/:id/tests', async (req, res) => {
  try {
    const seriesId = req.params.id;
    
    // First check if the series exists
    const testSeries = await TestSeries.findById(seriesId);
    
    if (!testSeries) {
      return res.status(404).json({ error: 'Test series not found' });
    }
    
    // Find all tests in this series
    const tests = await Test.find({ 
      isSeriesTest: true, 
      seriesId: seriesId 
    }).select('title description duration status subject');
    
    res.json(tests);
  } catch (err) {
    console.error('Error fetching tests for series:', err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Admin route to sync tests with their series (fixes data issues)
router.post('/admin/sync-tests', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Starting to sync tests with their series');
    
    // Get all test series
    const allSeries = await TestSeries.find({});
    console.log(`Found ${allSeries.length} test series`);
    
    // Results tracking
    const results = {
      seriesProcessed: 0,
      seriesUpdated: 0,
      totalTestsAdded: 0,
      errors: []
    };
    
    // Process each series
    for (const series of allSeries) {
      try {
        // Find all tests that belong to this series
        const seriesTests = await Test.find({
          isSeriesTest: true,
          seriesId: series._id
        }).select('_id');
        
        console.log(`Series ${series._id}: Found ${seriesTests.length} associated tests`);
        
        // Get test IDs
        const testIds = seriesTests.map(test => test._id);
        
        // Check if we need to update this series
        const currentTestIds = series.tests.map(id => id.toString());
        const missingTests = testIds.filter(id => !currentTestIds.includes(id.toString()));
        
        if (missingTests.length > 0) {
          console.log(`Series ${series._id}: Adding ${missingTests.length} missing tests`);
          
          // Update the series with all test IDs
          series.tests = [...new Set([...currentTestIds, ...testIds.map(id => id.toString())])];
          series.totalTests = series.tests.length;
          
          // Save the series
          await series.save();
          
          results.seriesUpdated++;
          results.totalTestsAdded += missingTests.length;
        }
        
        results.seriesProcessed++;
      } catch (seriesError) {
        console.error(`Error processing series ${series._id}:`, seriesError);
        results.errors.push({
          seriesId: series._id,
          error: seriesError.message
        });
      }
    }
    
    res.json({
      message: 'Test series synchronization completed',
      results
    });
  } catch (err) {
    console.error('Error syncing tests with series:', err);
    res.status(500).json({ error: 'Failed to sync tests with series' });
  }
});

module.exports = router; 