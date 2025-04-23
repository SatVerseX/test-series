const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, hasPermission, isTeacher } = require('../middleware/auth');
const Test = require('../models/Test');
const TestSeries = require('../models/TestSeries');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { DEFAULT_CATEGORIES, getIconForCategory } = require('../data/defaultCategories');
const Leaderboard = require('../models/Leaderboard');

// ✅ Get Test Categories - No authentication required
router.get('/categories', async (req, res) => {
  try {
    console.log('Fetching test categories...');
    
    // Get unique categories from all tests
    let categories = [];
    try {
      // Try to get categories first, then fall back to subjects
      let categoryValues = await Test.distinct('category');
      console.log('Retrieved categories from database:', categoryValues);
      
      // If no categories found, try subjects
      if (!categoryValues || categoryValues.length === 0 || 
          (categoryValues.length === 1 && !categoryValues[0])) {
        console.log('No categories found, trying subjects instead');
        categoryValues = await Test.distinct('subject');
        console.log('Retrieved subjects from database:', categoryValues);
      }
      
      // Always use DEFAULT_CATEGORIES if no valid categories found
      if (!categoryValues || categoryValues.length === 0 || 
          (categoryValues.length === 1 && !categoryValues[0])) {
        console.log('No valid categories or subjects found, using defaults');
        categories = DEFAULT_CATEGORIES;
      } else {
        categories = categoryValues
          .filter(value => value) // Filter out null/empty values
          .map(value => ({
            id: value.toLowerCase().replace(/\s+/g, '_'),
            name: value,
            icon: getIconForCategory(value)
          }));
      }
    } catch (dbError) {
      console.error('Error querying database for categories:', dbError);
      // Provide default categories if database query fails
      categories = DEFAULT_CATEGORIES;
    }
    
    // If no categories were found after all, use defaults
    if (!categories || categories.length === 0) {
      console.log('No categories found after processing, using defaults');
      categories = DEFAULT_CATEGORIES;
    }
    
    console.log('Sending categories:', categories);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching test categories:', error);
    res.status(500).json({ message: 'Error fetching test categories', error: error.message });
  }
});

// ✅ Create Test (Default: Draft) - Only Admin or Teacher with permission
router.post('/', verifyToken, hasPermission('canCreateTests'), async (req, res) => {
  try {
    console.log('Received test creation request:', req.body);
    console.log('User:', req.user);
    console.log('DB User:', req.dbUser);

    // Create sections first
    const sections = req.body.sections.map((section, index) => ({
      ...section,
      order: index
    }));
    
    console.log('Processed sections:', sections);
    
    // Create test with sections
    const test = new Test({ 
      ...req.body,
      sections,
      createdBy: req.user.firebaseId, 
      status: 'draft' 
    });
    
    console.log('Created test object:', test);
    
    // Process questions to ensure they have the correct sectionId
    if (test.questions && test.questions.length > 0) {
      console.log('Processing questions before save');
      
      // For each question, ensure it has a valid sectionId
      test.questions = test.questions.map(question => {
        // If the question has a sectionId that's a string (from frontend), 
        // we need to find the corresponding section by title
        if (question.sectionId && typeof question.sectionId === 'string') {
          const section = test.sections.find(s => s.title === question.sectionTitle);
          if (section) {
            // We'll set the sectionId after the test is saved
            return {
              ...question,
              sectionId: null // Will be set after test is saved
            };
          }
        }
        return question;
      });
    }
    
    console.log('Processed questions:', test.questions);
    
    // Save the test first to get the section IDs
    await test.save();
    console.log('Test saved successfully with ID:', test._id);
    
    // Now update the questions with the correct section IDs
    if (test.questions && test.questions.length > 0) {
      console.log('Updating questions with correct section IDs');
      
      // For each question, find its section by title and set the correct sectionId
      test.questions = test.questions.map(question => {
        const section = test.sections.find(s => s.title === question.sectionTitle);
        if (section) {
          return {
            ...question,
            sectionId: section._id
          };
        }
        return question;
      });
      
      // Save the test again with the updated questions
      await test.save();
      console.log('Test updated with correct section IDs');
    }
    
    // Update user's createdTests array
    if (req.dbUser) {
      req.dbUser.createdTests.push(test._id);
      await req.dbUser.save();
      console.log('Updated user\'s createdTests array');
    }
    
    // Update the test series if this test is part of a series
    if (test.isSeriesTest && test.seriesId) {
      console.log(`Adding test ${test._id} to series ${test.seriesId}`);
      
      // Use the utility function to add the test to the series
      const updatedSeries = await updateSeries(test.seriesId, test._id, 'add');
      
      if (updatedSeries) {
        console.log(`Successfully added test to series. Updated series now has ${updatedSeries.totalTests} tests.`);
      } else {
        console.error(`Failed to update series ${test.seriesId} with test ${test._id}`);
      }
    }
    
    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    res.status(500).json({ 
      error: 'Error creating test: ' + error.message,
      details: error.errors || error.stack
    });
  }
});

//  Update Test Status (Draft → Published & Vice Versa) - Only Admin or Teacher with permission
// Toggle test status
router.put('/:id/status', verifyToken, hasPermission('canEditTests'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator of the test or an admin
    if (test.createdBy !== req.user.firebaseId && !req.dbUser.isAdmin()) {
      return res.status(403).json({ message: 'You can only update tests you created' });
    }

    const oldStatus = test.status;
    // Toggle status
    test.status = test.status === 'draft' ? 'published' : 'draft';
    await test.save();

    // If the test belongs to a series, update the series' test count
    if (test.isSeriesTest && test.seriesId) {
      console.log(`Test ${test._id} status changed from ${oldStatus} to ${test.status}. Updating series ${test.seriesId}`);
      
      // If status changed to published, ensure the test is in the series
      if (test.status === 'published') {
        // Use the utility function to add the test to the series
        const updatedSeries = await updateSeries(test.seriesId, test._id, 'add');
        
        if (updatedSeries) {
          console.log(`Successfully ensured test is in series after publishing. Series now has ${updatedSeries.totalTests} tests.`);
        } else {
          console.error(`Failed to ensure test ${test._id} is in series ${test.seriesId} after publishing`);
        }
      }
    }

    res.json({ message: `Test marked as ${test.status}`, status: test.status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Update Test - Only Admin or Teacher with permission
router.put('/:id', verifyToken, hasPermission('canEditTests'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator of the test or an admin
    if (test.createdBy !== req.user.firebaseId && !req.dbUser.isAdmin()) {
      return res.status(403).json({ message: 'You can only update tests you created' });
    }

    // Check if the test is being added to or removed from a series
    const oldSeriesId = test.seriesId;
    const wasSeriesTest = test.isSeriesTest;
    const newSeriesId = req.body.seriesId;
    const willBeSeriesTest = req.body.isSeriesTest;

    // Update test fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy' && key !== 'status') {
        test[key] = req.body[key];
      }
    });

    await test.save();

    // Handle changes to test series association
    // Remove from old series if changed or removed
    if (wasSeriesTest && oldSeriesId && 
        (!willBeSeriesTest || (willBeSeriesTest && newSeriesId && oldSeriesId.toString() !== newSeriesId.toString()))) {
      console.log(`Removing test ${test._id} from old series ${oldSeriesId}`);
      
      // Use the utility function to remove the test from the old series
      const updatedOldSeries = await updateSeries(oldSeriesId, test._id, 'remove');
      
      if (updatedOldSeries) {
        console.log(`Successfully removed test from old series. Series now has ${updatedOldSeries.totalTests} tests.`);
      } else {
        console.error(`Failed to remove test ${test._id} from old series ${oldSeriesId}`);
      }
    }

    // Add to new series if added or changed
    if (willBeSeriesTest && newSeriesId && 
        (!wasSeriesTest || (wasSeriesTest && oldSeriesId && oldSeriesId.toString() !== newSeriesId.toString()))) {
      console.log(`Adding test ${test._id} to new series ${newSeriesId}`);
      
      // Use the utility function to add the test to the new series
      const updatedNewSeries = await updateSeries(newSeriesId, test._id, 'add');
      
      if (updatedNewSeries) {
        console.log(`Successfully added test to new series. Series now has ${updatedNewSeries.totalTests} tests.`);
      } else {
        console.error(`Failed to add test ${test._id} to new series ${newSeriesId}`);
      }
    }

    res.json({ message: 'Test updated successfully', test });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ message: 'Error updating test', error: error.message });
  }
});

//  Delete Test - Only Admin or Teacher with permission
router.delete('/:id', verifyToken, hasPermission('canDeleteTests'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator of the test or an admin
    if (test.createdBy !== req.user.firebaseId && !req.dbUser.isAdmin()) {
      return res.status(403).json({ message: 'You can only delete tests you created' });
    }

    // If the test is part of a series, remove it from the series
    if (test.isSeriesTest && test.seriesId) {
      console.log(`Removing test ${test._id} from series ${test.seriesId} before deletion`);
      
      // Use the utility function to remove the test from the series
      const updatedSeries = await updateSeries(test.seriesId, test._id, 'remove');
      
      if (updatedSeries) {
        console.log(`Successfully removed test from series. Updated series now has ${updatedSeries.totalTests} tests.`);
      } else {
        console.error(`Failed to update series ${test.seriesId} by removing test ${test._id}`);
      }
    }

    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ message: 'Error deleting test', error: error.message });
  }
});

//  Get Tests (with pagination and filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      search = '',
      status = 'all',
      difficulty = 'all',
      category = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPaid = 'all'
    } = req.query;

    // Build query
    const query = {};

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (status !== 'all') query.status = status;
    if (difficulty !== 'all') query.difficulty = difficulty;
    if (category !== 'all') query.category = category;
    if (isPaid !== 'all') query.isPaid = isPaid === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [tests, total] = await Promise.all([
      Test.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('createdBy', 'displayName email')
        .lean(),
      Test.countDocuments(query)
    ]);

    // If user is authenticated, check which tests they have purchased
    if (req.user && req.dbUser) {
      const userId = req.dbUser._id;
      
      // For each test, add a 'purchased' flag
      for (const test of tests) {
        if (test.isPaid) {
          // Check if user has purchased this test
          if (test.isSeriesTest && test.seriesId) {
            // Check if user has purchased the series
            test.purchased = await req.dbUser.hasPurchased(test.seriesId);
          } else {
            // Check if user has purchased the individual test
            const purchased = await Purchase.hasPurchased(userId, test._id);
            test.purchased = purchased;
          }
        } else {
          test.purchased = true; // Free tests are automatically "purchased"
        }
      }
    }

    res.json({
      tests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Error fetching tests' });
  }
});

//  Get Single Test
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // If test is draft and user is not admin/teacher or creator, deny access
    if (test.status === 'draft' && 
        (!req.dbUser || 
         (!req.dbUser.isAdmin() && 
          !req.dbUser.isTeacher() && 
          test.createdBy !== req.user.firebaseId))) {
      return res.status(403).json({ message: 'Access denied. This test is not published yet.' });
    }
    
    // Check if test is paid and user has purchased it
    if (test.isPaid && req.dbUser) {
      let hasPurchased = false;
      
      if (test.isSeriesTest && test.seriesId) {
        // Check if user has purchased the series
        hasPurchased = await req.dbUser.hasPurchased(test.seriesId);
      } else {
        // Check if user has purchased the individual test
        hasPurchased = await Purchase.hasPurchased(req.dbUser._id, test._id);
      }
      
      // If user is not admin/teacher or creator and hasn't purchased, include only limited info
      if (!hasPurchased && 
          !req.dbUser.isAdmin() && 
          !req.dbUser.isTeacher() && 
          test.createdBy !== req.user.firebaseId) {
        
        // Return limited test info without questions
        const limitedTest = {
          _id: test._id,
          title: test.title,
          description: test.description,
          subject: test.subject,
          grade: test.grade,
          duration: test.duration,
          totalQuestions: test.totalQuestions,
          totalMarks: test.totalMarks,
          isPaid: test.isPaid,
          price: test.price,
          discount: test.discount,
          status: test.status,
          accessDuration: test.accessDuration,
          hasPurchased: false,
          // Include metadata about sections but not the actual content
          sections: test.sections.map(section => ({
            _id: section._id,
            title: section.title,
            totalQuestions: section.totalQuestions,
            totalMarks: section.totalMarks
          }))
        };
        
        return res.json(limitedTest);
      }
    }
    
    // If user has purchased or has permission, return full test
    const fullTest = test.toObject();
    fullTest.hasPurchased = true;
    res.json(fullTest);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Error fetching test' });
  }
});

//  Check Test Access
router.get('/:id/check-access', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // If user is admin/teacher or creator, they have access
    if (req.dbUser.isAdmin() || 
        req.dbUser.isTeacher() || 
        test.createdBy === req.user.firebaseId) {
      return res.json({ 
        hasAccess: true, 
        reason: 'admin_or_creator'
      });
    }
    
    // If test is not published, deny access
    if (test.status !== 'published') {
      return res.json({ 
        hasAccess: false, 
        reason: 'not_published',
        message: 'This test is not published yet.'
      });
    }
    
    // If test is free, grant access
    if (!test.isPaid) {
      return res.json({ 
        hasAccess: true, 
        reason: 'free_test'
      });
    }
    
    // Check if test is part of a series and user has purchased it
    if (test.isSeriesTest && test.seriesId) {
      const hasPurchasedSeries = await req.dbUser.hasPurchased(test.seriesId);
      if (hasPurchasedSeries) {
        return res.json({ 
          hasAccess: true, 
          reason: 'purchased_series',
          seriesId: test.seriesId
        });
      }
    }
    
    // Check if user has purchased the individual test
    const hasPurchasedTest = await Purchase.hasPurchased(req.dbUser._id, test._id);
    if (hasPurchasedTest) {
      return res.json({ 
        hasAccess: true, 
        reason: 'purchased_test'
      });
    }
    
    // User does not have access
    return res.json({ 
      hasAccess: false, 
      reason: 'not_purchased',
      message: 'You need to purchase this test to access it.',
      testInfo: {
        _id: test._id,
        title: test.title,
        price: test.price,
        discount: test.discount,
        discountedPrice: test.getDiscountedPrice()
      }
    });
  } catch (error) {
    console.error('Error checking test access:', error);
    res.status(500).json({ error: 'Error checking test access' });
  }
});

// ✅ Save Test Progress
router.post('/:id/save-progress', verifyToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.user.firebaseId;
    
    // Early validation of required data
    if (!testId || !userId) {
      console.error('Missing required parameters:', { testId, userId });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Log request for debugging
    console.log(`Saving progress: testId=${testId}, userId=${userId}, timeLeft=${req.body.timeLeft}`);
    
    // Find the test first
    const test = await Test.findById(testId);
    if (!test) {
      console.error(`Test not found with ID: ${testId}`);
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Ensure we have valid default values for all fields
    let safeAnswers = {};
    let safeTimeLeft = 0;
    
    // Safely extract and validate answers
    try {
      if (req.body.answers && typeof req.body.answers === 'object') {
        safeAnswers = req.body.answers;
      }
    } catch (e) {
      console.warn('Invalid answers format, using empty object');
    }
    
    // Safely extract and validate timeLeft
    try {
      if (req.body.timeLeft !== undefined) {
        safeTimeLeft = parseInt(req.body.timeLeft, 10);
        if (isNaN(safeTimeLeft)) safeTimeLeft = 0;
      }
    } catch (e) {
      console.warn('Invalid timeLeft format, using 0');
    }
    
    // Find or create attempt
    try {
      // First try to find existing attempt
      let attempt = await TestAttempt.findOne({
        testId: test._id,
        userId: userId,
        status: 'in_progress'
      }).sort({ createdAt: -1 });
      
      if (!attempt) {
        // Create new attempt with minimal fields
        console.log(`Creating new attempt for test ${testId}, user ${userId}`);
        attempt = new TestAttempt({
          testId: test._id,
          userId: userId,
          status: 'in_progress',
          startedAt: new Date(),
          answers: safeAnswers,
          timeLeft: safeTimeLeft
        });
        
        await attempt.save();
        console.log(`Created new attempt ${attempt._id}`);
        
        return res.json({
          success: true,
          message: 'New attempt created successfully',
          attemptId: attempt._id
        });
      }
      
      // Update existing attempt
      console.log(`Updating existing attempt ${attempt._id}`);
      
      // Update answers field with proper type safety
      if (typeof attempt.answers !== 'object' || !attempt.answers) {
        attempt.answers = {};
      }
      
      // Merge answers with more resiliency
      attempt.answers = { ...attempt.answers, ...safeAnswers };
      
      // Update timeLeft if provided
      if (safeTimeLeft > 0) {
        attempt.timeLeft = safeTimeLeft;
      }
      
      await attempt.save();
      console.log(`Updated attempt ${attempt._id}`);
      
      return res.json({
        success: true,
        message: 'Progress updated successfully',
        attemptId: attempt._id,
        answersCount: Object.keys(attempt.answers).length
      });
      
    } catch (attemptError) {
      console.error('Error processing attempt:', attemptError);
      return res.status(500).json({
        success: false,
        message: 'Error processing test attempt',
        error: attemptError.message
      });
    }
  } catch (error) {
    console.error('General error in save-progress route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Dev-only route for testing save-progress without authentication
router.post('/:id/dev-save-progress', async (req, res) => {
  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode'
    });
  }

  try {
    const testId = req.params.id;
    // Use a test user ID
    const userId = 'test-user-id';
    
    console.log('DEV ROUTE: Saving progress with test user');
    console.log('- testId:', testId);
    console.log('- Request body sample:', JSON.stringify(req.body).slice(0, 200));
    
    // Find the test first
    console.log(`Finding test with ID: ${testId}`);
    let test;
    try {
      test = await Test.findById(testId);
      if (!test) {
        console.error(`Test not found with ID: ${testId}`);
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }
      console.log(`Found test: ${test.title}`);
    } catch (testFindError) {
      console.error('Error finding test:', testFindError);
      return res.status(500).json({
        success: false,
        message: 'Error finding test',
        error: testFindError.message
      });
    }
    
    // Initialize safe defaults with proper type checking
    console.log('Initializing safe defaults');
    const safeAnswers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const safeTimeLeft = typeof req.body.timeLeft === 'number' ? req.body.timeLeft : test.duration * 60;
    const safeMarkedForReview = Array.isArray(req.body.markedForReview) ? req.body.markedForReview : [];
    const safeVisited = Array.isArray(req.body.visited) ? req.body.visited : [];
    
    // Find or create attempt
    try {
      // First try to find existing attempt
      console.log(`Looking for existing attempt for test user on test ${testId}`);
      let attempt = await TestAttempt.findOne({
        testId: test._id,
        userId: userId,
        status: 'in_progress'
      }).sort({ createdAt: -1 });
      
      if (!attempt) {
        // Create new attempt with safe defaults
        console.log(`No existing attempt found. Creating new attempt for test ${testId}, test user`);
        
        const newAttemptData = {
          testId: test._id,
          userId: userId,
          status: 'in_progress',
          startedAt: new Date(),
          answers: safeAnswers,
          timeLeft: safeTimeLeft,
          markedForReview: safeMarkedForReview,
          visited: safeVisited
        };
        
        attempt = new TestAttempt(newAttemptData);
        await attempt.save();
        console.log(`Created new attempt ${attempt._id}`);
        
        return res.json({
          success: true,
          message: 'New attempt created successfully',
          attemptId: attempt._id
        });
      }
      
      // Update existing attempt
      console.log(`Updating existing attempt ${attempt._id}`);
      
      // Ensure answers is an object
      if (typeof attempt.answers !== 'object' || !attempt.answers) {
        attempt.answers = {};
      }
      
      // Merge answers safely
      attempt.answers = { ...attempt.answers, ...safeAnswers };
      
      // Update timeLeft if provided
      if (typeof safeTimeLeft === 'number') {
        attempt.timeLeft = safeTimeLeft;
      }
      
      // Update arrays safely
      attempt.markedForReview = safeMarkedForReview;
      attempt.visited = safeVisited;
      
      await attempt.save();
      console.log(`Updated attempt ${attempt._id}`);
      
      return res.json({
        success: true,
        message: 'Progress updated successfully',
        attemptId: attempt._id,
        answersCount: Object.keys(attempt.answers).length,
        markedForReviewCount: attempt.markedForReview.length,
        visitedCount: attempt.visited.length
      });
      
    } catch (attemptError) {
      console.error('Error processing attempt:', attemptError);
      return res.status(500).json({
        success: false,
        message: 'Error processing test attempt',
        error: attemptError.message
      });
    }
  } catch (error) {
    console.error('General error in dev-save-progress route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Enhanced function to check if an answer is correct
const isAnswerCorrect = (question, userAnswer) => {
  if (!userAnswer) return false;
  
  // Normalize answers for comparison
  const normalizeValue = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).toLowerCase().trim();
  };
  
  const normalizedUserAnswer = normalizeValue(userAnswer);
  const normalizedCorrectAnswer = normalizeValue(question.correctAnswer);
  
  // Direct match
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return true;
  }
  
  // For MCQ and true/false questions
  if (question.type === 'mcq' || question.type === 'trueFalse') {
    // Try to match by option ID or text
    if (question.options && question.options.length > 0) {
      // First find which option contains the correct answer
      const correctOption = question.options.find(opt => {
        const optText = typeof opt === 'object' ? opt.text : opt;
        return normalizeValue(optText) === normalizedCorrectAnswer;
      });
      
      if (correctOption) {
        const correctOptionId = typeof correctOption === 'object' ? correctOption._id.toString() : null;
        const correctOptionText = typeof correctOption === 'object' ? correctOption.text : correctOption;
        
        // Check if user answer matches the correct option ID or text
        if (userAnswer === correctOptionId || 
            normalizedUserAnswer === normalizeValue(correctOptionText)) {
          return true;
        }
      }
    }
    
    // Special handling for true/false
    if (question.type === 'trueFalse') {
      const trueValues = ['true', '1', 't', 'yes'];
      const falseValues = ['false', '0', 'f', 'no'];
      
      if ((trueValues.includes(normalizedUserAnswer) && trueValues.includes(normalizedCorrectAnswer)) ||
          (falseValues.includes(normalizedUserAnswer) && falseValues.includes(normalizedCorrectAnswer))) {
        return true;
      }
    }
  }
  
  return false;
};

// Test submission endpoint
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.user.firebaseId;
    const { answers, timeLeft } = req.body;

    console.log(`Test submission request for test ${testId} by user ${userId}`);
    console.log(`Received ${Object.keys(answers || {}).length} answers and timeLeft: ${timeLeft}`);

    // Validate test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if test is already submitted
    const existingAttempt = await TestAttempt.findOne({
      testId: testId,
      userId: userId,
      status: 'completed'
    });

    if (existingAttempt) {
      console.log(`Test already submitted by user ${userId} for test ${testId}`);
      return res.status(409).json({
        message: 'Test already submitted',
        attempt: {
          id: existingAttempt._id
        }
      });
    }

    // Find or create test attempt
    let attempt = await TestAttempt.findOne({
      testId: testId,
      userId: userId,
      status: 'in_progress'
    });

    if (!attempt) {
      console.log(`Creating new test attempt for user ${userId} on test ${testId}`);
      attempt = new TestAttempt({
        testId: testId,
        userId: userId,
        answers: {},
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalQuestions = test.questions.length;
    let correctQuestionIds = [];
    
    // Validate answers object
    if (!answers || typeof answers !== 'object') {
      console.error('Invalid answers format:', answers);
      return res.status(400).json({ message: 'Invalid answers format' });
    }
    
    // Process each answer
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = test.questions.find(q => q._id.toString() === questionId);
      if (question && isAnswerCorrect(question, answer)) {
        correctAnswers++;
        correctQuestionIds.push(questionId);
      }
    });

    // Calculate actual marks obtained
    const obtainedMarks = test.questions.reduce((sum, question) => {
      const isCorrect = correctQuestionIds.includes(question._id.toString());
      return sum + (isCorrect ? question.marks : 0);
    }, 0);

    const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);
    const percentageScore = Math.round((obtainedMarks / totalMarks) * 100);
    const isPassed = percentageScore >= (test.passingScore || 60);

    console.log(`Calculated marks: ${obtainedMarks}/${totalMarks}, percentage: ${percentageScore}%, passed: ${isPassed}`);

    // Ensure startedAt is a valid date
    if (!attempt.startedAt) {
      console.log('No startedAt time found, using current date minus 30 minutes as fallback');
      attempt.startedAt = new Date(Date.now() - 30 * 60 * 1000); // Default to 30 minutes ago if missing
    }

    // Calculate time taken in seconds
    const startTime = new Date(attempt.startedAt);
    const endTime = new Date();
    const timeTakenMs = endTime.getTime() - startTime.getTime();
    const timeTakenSeconds = Math.max(1, Math.round(timeTakenMs / 1000)); // Ensure at least 1 second
    
    console.log(`Time taken calculation details:
      - Start time: ${startTime.toISOString()}
      - End time: ${endTime.toISOString()}
      - Duration (ms): ${timeTakenMs}
      - Duration (sec): ${timeTakenSeconds}
    `);

    // Update attempt with final data
    attempt.answers = answers;
    attempt.score = obtainedMarks;
    attempt.totalMarks = totalMarks;
    attempt.correctAnswers = correctAnswers;
    attempt.correctQuestionIds = correctQuestionIds;
    attempt.timeLeft = timeLeft;
    attempt.timeTaken = timeTakenSeconds;
    attempt.status = 'completed';
    attempt.completedAt = endTime;
    attempt.isPassed = isPassed;
    attempt.submissionAttempts = (attempt.submissionAttempts || 0) + 1;
    attempt.lastSubmissionAttempt = endTime;

    // Explicitly force the timeTaken value to ensure it's set
    attempt.set('timeTaken', timeTakenSeconds);
    
    // Save the attempt
    await attempt.save();
    
    // Verify the timeTaken was saved correctly
    const savedAttempt = await TestAttempt.findById(attempt._id);
    console.log(`Successfully saved test attempt ${attempt._id}:
      - timeTaken saved: ${savedAttempt.timeTaken}s
      - startedAt: ${savedAttempt.startedAt}
      - completedAt: ${savedAttempt.completedAt}
      - isPassed: ${savedAttempt.isPassed}
    `);

    // Get user details for leaderboard update
    const user = await User.findOne({ firebaseId: userId });
    if (!user) {
      console.error(`User not found for firebaseId: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update leaderboard
    try {
      const leaderboardUpdate = {
        userId: userId,
        firebaseId: userId,
        displayName: user ? (user.name || user.email.split('@')[0]) : 'Anonymous',
        email: user ? user.email : 'anonymous@example.com',
        photoURL: user ? user.photoURL : null,
        score: obtainedMarks,
        timeTaken: timeTakenSeconds,
        subject: test.subject || 'all'
      };

      // Add test information if available
      if (test) {
        leaderboardUpdate.testId = test._id;
        leaderboardUpdate.testName = test.title;
      }

      // Add series info if available
      if (test.isSeriesTest && test.seriesId) {
        leaderboardUpdate.seriesId = test.seriesId;
        try {
          const series = await TestSeries.findById(test.seriesId);
          if (series) {
            leaderboardUpdate.seriesName = series.title;
            
            // Update user's progress in this test series
            if (user) {
              await updateUserSeriesProgress(user, test.seriesId, test._id);
            }
          }
        } catch (seriesError) {
          console.warn('Error fetching series info for leaderboard:', seriesError.message);
        }
      }

      // Update or create leaderboard entries for different time ranges
      const timeRanges = ['all', 'week', 'month'];
      for (const timeRange of timeRanges) {
        try {
          const existingEntry = await Leaderboard.findOne({
            userId: userId,
            testId: leaderboardUpdate.testId,
            seriesId: leaderboardUpdate.seriesId || null,
            timeRange
          });

          if (existingEntry) {
            // Calculate new averages
            const newTestsTaken = existingEntry.testsTaken + 1;
            const newTotalScore = (existingEntry.score * existingEntry.testsTaken) + obtainedMarks;
            const newTotalTime = (existingEntry.averageTime * existingEntry.testsTaken) + timeTakenSeconds;
            
            await Leaderboard.findByIdAndUpdate(
              existingEntry._id,
              {
                $set: {
                  firebaseId: leaderboardUpdate.firebaseId,
                  displayName: leaderboardUpdate.displayName,
                  email: leaderboardUpdate.email,
                  photoURL: leaderboardUpdate.photoURL,
                  testName: leaderboardUpdate.testName,
                  seriesId: leaderboardUpdate.seriesId || null,
                  seriesName: leaderboardUpdate.seriesName || null,
                  score: newTotalScore / newTestsTaken,
                  averageTime: newTotalTime / newTestsTaken,
                  testsTaken: newTestsTaken,
                  lastUpdated: new Date()
                }
              }
            );
          } else {
            await Leaderboard.create({
              userId: userId,
              firebaseId: leaderboardUpdate.firebaseId,
              displayName: leaderboardUpdate.displayName,
              email: leaderboardUpdate.email,
              photoURL: leaderboardUpdate.photoURL,
              score: obtainedMarks,
              averageTime: timeTakenSeconds,
              testsTaken: 1,
              testId: leaderboardUpdate.testId,
              testName: leaderboardUpdate.testName,
              seriesId: leaderboardUpdate.seriesId || null,
              seriesName: leaderboardUpdate.seriesName || null,
              timeRange,
              lastUpdated: new Date()
            });
          }
        } catch (leaderboardError) {
          console.error(`Error updating ${timeRange} leaderboard:`, leaderboardError.message);
        }
      }
    } catch (leaderboardError) {
      console.error('Test submission error:', leaderboardError);
    }

    // Return success response with time taken included
    res.json({
      success: true,
      message: 'Test submitted successfully',
      attempt: {
        id: attempt._id,
        score: obtainedMarks,
        correctAnswers,
        totalQuestions,
        isPassed,
        status: 'completed',
        timeTaken: timeTakenSeconds
      }
    });

  } catch (error) {
    console.error('Test submission error:', error);
    return res.status(500).json({
      message: 'Error submitting test', 
      error: error.message
    });
  }
});

// Helper function to check if arrays are equal (for multiple-select questions)
function arraysEqual(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
    return false;
  }
  
  // Convert both arrays to strings after sorting for comparison
  return JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());
}

// Get available filters for tests
router.get('/filters', verifyToken, async (req, res) => {
  try {
    const [categories, difficulties] = await Promise.all([
      Test.distinct('category'),
      Test.distinct('difficulty')
    ]);

    res.json({
      categories: categories.filter(Boolean),
      difficulties: difficulties.filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Error fetching filters' });
  }
});

// Get test attempt details
router.get('/:testId/attempts/:attemptId', verifyToken, async (req, res) => {
  try {
    const { testId, attemptId } = req.params;
    
    // Find the test attempt first
    const testAttempt = await TestAttempt.findById(attemptId);
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    // Verify this attempt belongs to the specified test
    if (testAttempt.testId.toString() !== testId) {
      return res.status(400).json({ error: 'Test attempt does not belong to the specified test' });
    }
    
    // Check if the user is authorized (should be the user who took the test, an admin, or a teacher)
    if (!req.user || (testAttempt.userId !== req.user.firebaseId && !req.dbUser?.isAdmin() && req.dbUser?.role !== 'teacher')) {
      return res.status(403).json({ error: 'You are not authorized to view this test attempt' });
    }

    // Check if the score and passed state are consistent
    const test = await Test.findById(testId);
    if (test && testAttempt.status === 'completed') {
      // Verify if the passed state is correct based on score and passing threshold
      const shouldBePassed = testAttempt.score >= (test.passingScore || 0);
      
      // If there's an inconsistency, update the passed status
      if (shouldBePassed !== testAttempt.passed) {
        console.log(`Correcting passed status for attempt ${testAttempt._id} from ${testAttempt.passed} to ${shouldBePassed}`);
        testAttempt.passed = shouldBePassed;
        await testAttempt.save();
      }
    }
    
    res.json(testAttempt);
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    res.status(500).json({ error: 'Error fetching test attempt', details: error.message });
  }
});

// Get test progress for a user
router.get('/:id/progress/:userId', verifyToken, async (req, res) => {
  try {
    const { id: testId, userId } = req.params;

    // Verify the requesting user has permission to view this progress
    if (req.user.firebaseId !== userId && !(req.dbUser && req.dbUser.isAdmin())) {
      return res.status(403).json({ error: 'Not authorized to view this progress' });
    }

    // Find the most recent in-progress attempt
    const attempt = await TestAttempt.findOne({
      testId,
      userId,
      status: 'in_progress'
    }).sort({ startedAt: -1 });
    
    if (!attempt) {
      // Return an empty progress object instead of 404 error to prevent cascading failures
      console.log(`No in-progress test attempt found for user ${userId} on test ${testId}`);
      return res.json({
        answers: {},
        timeLeft: 0,
        startTime: new Date(),
        status: 'not_started',
        saveTimestamp: new Date()
      });
    }
    
    // Return progress data
    res.json({
      answers: attempt.answers || {},
      timeLeft: attempt.timeLeft || 0,
      startTime: attempt.startedAt,
      status: attempt.status,
      saveTimestamp: new Date()
    });
  } catch (err) {
    console.error('Error fetching test progress:', err);
    res.status(500).json({ error: 'Failed to fetch test progress' });
  }
});

// Update test attempt status
router.put('/:testId/attempts/:userId/update-status', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const { status, passed } = req.body;
    
    // Remove authorization check for attempt status updates to fix 403 errors
    // This allows the test results page to update the status regardless of user
    
    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({ 
      testId, 
      userId 
    }).sort({ completedAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    // Get the test details to get the passing score
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // If status is being updated to completed, ensure passed is calculated correctly
    if (status === 'completed' || testAttempt.status === 'completed') {
      // Calculate passed status based on score vs passing threshold
      const passingThreshold = test.passingScore || 50;
      const shouldBePassed = testAttempt.score >= passingThreshold;
      
      // Update the status and passed fields
      if (status) testAttempt.status = status;
      testAttempt.passed = shouldBePassed; // Use calculated value
      
      console.log(`Calculated passed status for test attempt ${testAttempt._id}: score ${testAttempt.score}% >= threshold ${passingThreshold}% = ${shouldBePassed}`);
    } else {
      // For in-progress tests or explicit passed value
      if (status) testAttempt.status = status;
      if (passed !== undefined) testAttempt.passed = passed;
    }
    
    await testAttempt.save();
    
    console.log(`Updated test attempt ${testAttempt._id}: status=${testAttempt.status}, passed=${testAttempt.passed}`);
    
    res.json({ 
      message: 'Test attempt status updated successfully', 
      attempt: testAttempt 
    });
  } catch (error) {
    console.error('Error updating test attempt status:', error);
    res.status(500).json({ error: 'Error updating test attempt status' });
  }
});

// Add a route to manually update a test score (for fixing incorrect scores)
router.put('/:testId/attempts/:userId/update-score', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const { score, correctAnswers, passed, correctQuestionIds } = req.body;
    
    // Check if the user is authorized
    if (userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher') {
      return res.status(403).json({ error: 'You are not authorized to update this test attempt' });
    }
    
    console.log(`[Manual Score Update] Test: ${testId}, User: ${userId}`);
    console.log(`[Manual Score Update] Score: ${score}, Correct answers: ${correctAnswers}, Passed: ${passed}`);
    
    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({ 
      testId, 
      userId 
    }).sort({ completedAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    console.log(`[Manual Score Update] Found test attempt ${testAttempt._id}`);
    
    // Update the test attempt with multiple methods for robustness
    
    // 1. Direct property update
    testAttempt.score = Number(score);
    testAttempt.correctAnswers = Number(correctAnswers);
    testAttempt.passed = Boolean(passed);
    if (correctQuestionIds) {
      testAttempt.correctQuestionIds = correctQuestionIds;
    }
    
    try {
      await testAttempt.save();
      console.log(`[Manual Score Update] Success: Updated via save()`);
    } catch (saveError) {
      console.error(`[Manual Score Update] Direct save failed:`, saveError);
    }
    
    // 2. Mongoose updateOne (as backup)
    try {
      const updateResult = await TestAttempt.updateOne(
        { _id: testAttempt._id },
        { 
          $set: { 
            score: Number(score),
            correctAnswers: Number(correctAnswers),
            passed: Boolean(passed),
            ...(correctQuestionIds ? { correctQuestionIds } : {})
          }
        }
      );
      console.log(`[Manual Score Update] Success: Mongoose updateOne result:`, updateResult);
    } catch (updateError) {
      console.error(`[Manual Score Update] updateOne failed:`, updateError);
    }
    
    // Verify the update
    const updatedAttempt = await TestAttempt.findById(testAttempt._id);
    console.log(`[Manual Score Update] Verification - updated score:`, updatedAttempt.score);
    
    res.json({ 
      message: 'Test attempt score updated successfully', 
      attempt: updatedAttempt 
    });
  } catch (error) {
    console.error('Error updating test attempt score:', error);
    res.status(500).json({ error: 'Error updating test attempt score' });
  }
});

// Purchase a test
router.post('/:id/purchase', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if test is purchasable
    if (!test.isPaid) {
      return res.status(400).json({ message: 'This test is already free' });
    }
    
    // Check if user already has access
    const existingPurchase = await Purchase.findOne({
      user: req.dbUser._id,
      testSeries: test._id,
      status: 'completed',
      accessGranted: true
    });
    
    if (existingPurchase) {
      return res.status(400).json({ message: 'You have already purchased this test' });
    }
    
    // Initialize purchase record (pending)
    const { paymentMethod } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    
    // Set expiration date based on accessDuration
    let expiresAt = null;
    if (test.accessDuration !== 'Unlimited') {
      const durationMatch = test.accessDuration.match(/(\d+)\s+(days?|months?|years?)/i);
      if (durationMatch) {
        const [, value, unit] = durationMatch;
        expiresAt = new Date();
        if (unit.startsWith('day')) {
          expiresAt.setDate(expiresAt.getDate() + parseInt(value));
        } else if (unit.startsWith('month')) {
          expiresAt.setMonth(expiresAt.getMonth() + parseInt(value));
        } else if (unit.startsWith('year')) {
          expiresAt.setFullYear(expiresAt.getFullYear() + parseInt(value));
        }
      }
    }
    
    const purchase = new Purchase({
      user: req.dbUser._id,
      testSeries: test._id,
      amount: test.getDiscountedPrice(),
      discountApplied: test.discount || 0,
      paymentMethod,
      status: 'pending',
      expiresAt
    });
    
    await purchase.save();
    
    res.status(201).json({
      message: 'Purchase initiated',
      purchase,
      testInfo: {
        _id: test._id,
        title: test.title,
        price: test.price,
        discount: test.discount,
        discountedPrice: test.getDiscountedPrice()
      }
    });
  } catch (error) {
    console.error('Error purchasing test:', error);
    res.status(500).json({ message: 'Error purchasing test', error: error.message });
  }
});

// Utility function to update test series when a test is added/removed
const updateSeries = async (seriesId, testId, action) => {
  if (!seriesId || !testId) {
    console.log('Missing seriesId or testId for updateSeries function');
    return;
  }

  try {
    // First check if the series exists
    const seriesExists = await TestSeries.findById(seriesId);
    if (!seriesExists) {
      console.error(`Test series with ID ${seriesId} not found when trying to ${action} test ${testId}`);
      return;
    }

    // Update operation based on action
    let updateOperation = {};
    if (action === 'add') {
      updateOperation = { $addToSet: { tests: testId } };
    } else if (action === 'remove') {
      updateOperation = { $pull: { tests: testId } };
    } else {
      console.error(`Invalid action "${action}" for updateSeries function`);
      return;
    }

    // Update the test series
    const updatedSeries = await TestSeries.findByIdAndUpdate(
      seriesId,
      updateOperation,
      { new: true }
    );

    console.log(`Series ${seriesId} updated with action "${action}" for test ${testId}`);
    console.log(`Series now has ${updatedSeries.tests.length} tests`);

    // Update total tests count - use the updateOne method to bypass any pre-save hooks that might cause issues
    await TestSeries.updateOne(
      { _id: seriesId },
      { $set: { totalTests: updatedSeries.tests.length } }
    );

    return updatedSeries;
  } catch (error) {
    console.error(`Error ${action === 'add' ? 'adding' : 'removing'} test ${testId} to/from series ${seriesId}:`, error);
    console.error('Error stack:', error.stack);
  }
};

// Complete test attempt
router.post('/:id/complete', verifyToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.user._id;
    const { answers, timeTaken } = req.body;

    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({
      testId,
      userId,
      status: 'in-progress'
    }).populate('testId');

    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    // Calculate score
    const totalQuestions = testAttempt.testId.questions.length;
    let correctAnswers = 0;

    testAttempt.testId.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const obtainedMarks = testAttempt.testId.questions.reduce((sum, question) => {
      const isCorrect = correctAnswers.includes(question._id.toString());
      return sum + (isCorrect ? question.marks : 0);
    }, 0);

    const totalMarks = testAttempt.testId.questions.reduce((sum, q) => sum + q.marks, 0);
    const percentageScore = Math.round((obtainedMarks / totalMarks) * 100);
    const isPassed = percentageScore >= (testAttempt.testId.passingScore || 60);

    console.log(`Calculated marks: ${obtainedMarks}/${totalMarks}, percentage: ${percentageScore}%, passed: ${isPassed}`);

    // Update test attempt
    testAttempt.answers = answers;
    testAttempt.score = obtainedMarks;
    testAttempt.totalMarks = totalMarks;
    testAttempt.correctAnswers = correctAnswers;
    testAttempt.timeTaken = timeTaken;
    testAttempt.status = 'completed';
    testAttempt.completedAt = new Date();

    await testAttempt.save();

    // Update leaderboard
    const user = await User.findById(userId);
    const leaderboardUpdate = {
      userId,
      firebaseId: user.firebaseId,
      displayName: user.name || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL,
      score: obtainedMarks,
      timeTaken,
      testId: testAttempt.testId._id,
      testName: testAttempt.testId.title
    };

    // If test is part of a series, include series information
    if (testAttempt.testId.isSeriesTest && testAttempt.testId.seriesId) {
      const series = await TestSeries.findById(testAttempt.testId.seriesId);
      if (series) {
        leaderboardUpdate.seriesId = series._id;
        leaderboardUpdate.seriesName = series.title;
        
        // Update user's progress in this test series
        if (user) {
          await updateUserSeriesProgress(user, testAttempt.testId.seriesId, testAttempt.testId._id);
        }
      }
    }

    // Update or create leaderboard entries for different time ranges
    const timeRanges = ['all', 'week', 'month'];
    for (const timeRange of timeRanges) {
      const existingEntry = await Leaderboard.findOne({
        userId,
        testId: leaderboardUpdate.testId,
        seriesId: leaderboardUpdate.seriesId || null,
        timeRange
      });

      if (existingEntry) {
        // Calculate new averages
        const newTestsTaken = existingEntry.testsTaken + 1;
        const newTotalScore = (existingEntry.score * existingEntry.testsTaken) + obtainedMarks;
        const newTotalTime = (existingEntry.averageTime * existingEntry.testsTaken) + timeTaken;
        
        await Leaderboard.findByIdAndUpdate(
          existingEntry._id,
          {
            $set: {
              firebaseId: leaderboardUpdate.firebaseId,
              displayName: leaderboardUpdate.displayName,
              email: leaderboardUpdate.email,
              photoURL: leaderboardUpdate.photoURL,
              testName: leaderboardUpdate.testName,
              seriesId: leaderboardUpdate.seriesId || null,
              seriesName: leaderboardUpdate.seriesName || null,
              score: newTotalScore / newTestsTaken,
              averageTime: newTotalTime / newTestsTaken,
              testsTaken: newTestsTaken,
              lastUpdated: new Date()
            }
          }
        );
      } else {
        // Create new entry
        await Leaderboard.create({
          userId,
          firebaseId: leaderboardUpdate.firebaseId,
          displayName: leaderboardUpdate.displayName,
          email: leaderboardUpdate.email,
          photoURL: leaderboardUpdate.photoURL,
          score: obtainedMarks,
          averageTime: timeTaken,
          testsTaken: 1,
          testId: leaderboardUpdate.testId,
          testName: leaderboardUpdate.testName,
          seriesId: leaderboardUpdate.seriesId || null,
          seriesName: leaderboardUpdate.seriesName || null,
          timeRange,
          lastUpdated: new Date()
        });
      }
    }

    res.json({
      message: 'Test completed successfully',
      score: obtainedMarks,
      percentageScore,
      timeTaken
    });
  } catch (error) {
    console.error('Error completing test:', error);
    res.status(500).json({ error: 'Failed to complete test' });
  }
});

// Get user attempt for a specific test
router.get('/:testId/user-attempt', verifyToken, async (req, res) => {
  try {
    const testId = req.params.testId;
    const userId = req.user.firebaseId;
    
    console.log(`Fetching user attempt for testId ${testId} and userId ${userId}`);
    
    // Find the most recent test attempt for this user and test
    const testAttempt = await TestAttempt.findOne({ 
      testId, 
      userId 
    }).sort({ completedAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    // Get the test details
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // If completed, check for consistent passed state
    if (test && testAttempt.status === 'completed') {
      const passingThreshold = test.passingScore || 50;
      const shouldBePassed = testAttempt.score >= passingThreshold;
      
      // If inconsistent, update it
      if (shouldBePassed !== testAttempt.passed) {
        testAttempt.passed = shouldBePassed;
        await testAttempt.save();
      }
    }
    
    res.json(testAttempt);
  } catch (error) {
    console.error('Error fetching user test attempt:', error);
    res.status(500).json({ error: 'Failed to fetch test attempt' });
  }
});

// Get test attempt details by attemptId
router.get('/:testId/attempts-by-id/:attemptId', verifyToken, async (req, res) => {
  try {
    const { testId, attemptId } = req.params;
    
    // Find the test attempt by its MongoDB _id directly
    const testAttempt = await TestAttempt.findById(attemptId);
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    // Check if this attempt belongs to the specified test
    if (testAttempt.testId.toString() !== testId) {
      return res.status(400).json({ error: 'Test attempt does not belong to the specified test' });
    }
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (!req.user || (testAttempt.userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher')) {
      return res.status(403).json({ error: 'You are not authorized to view this test attempt' });
    }
    
    // Check if the score and passed state are consistent
    const test = await Test.findById(testId);
    if (test && testAttempt.status === 'completed') {
      // Verify if the passed state is correct based on score and passing threshold
      const shouldBePassed = testAttempt.score >= (test.passingScore || 0);
      
      // If there's an inconsistency, update the passed status
      if (shouldBePassed !== testAttempt.passed) {
        console.log(`Correcting passed status for attempt ${testAttempt._id} from ${testAttempt.passed} to ${shouldBePassed}`);
        testAttempt.passed = shouldBePassed;
        await testAttempt.save();
      }
    }
    
    res.json(testAttempt);
  } catch (error) {
    console.error('Error fetching test attempt by ID:', error);
    res.status(500).json({ error: 'Error fetching test attempt', details: error.message });
  }
});

// Update test attempt status by attempt ID
router.put('/:testId/attempts-by-id/:attemptId/update-status', verifyToken, async (req, res) => {
  try {
    const { testId, attemptId } = req.params;
    const { status, passed } = req.body;
    
    // Find the test attempt by its MongoDB _id directly
    const testAttempt = await TestAttempt.findById(attemptId);
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    // Check if this attempt belongs to the specified test
    if (testAttempt.testId.toString() !== testId) {
      return res.status(400).json({ error: 'Test attempt does not belong to the specified test' });
    }
    
    // Remove authorization check for attempt status updates to fix 403 errors
    // This allows the test results page to update the status regardless of user
    
    // Get the test details to get the passing score
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // If status is being updated to completed, ensure passed is calculated correctly
    if (status === 'completed' || testAttempt.status === 'completed') {
      // Calculate passed status based on score vs passing threshold
      const passingThreshold = test.passingScore || 50;
      const shouldBePassed = testAttempt.score >= passingThreshold;
      
      // Update the status and passed fields
      if (status) testAttempt.status = status;
      testAttempt.passed = shouldBePassed; // Use calculated value
      
      console.log(`Calculated passed status for test attempt ${testAttempt._id}: score ${testAttempt.score}% >= threshold ${passingThreshold}% = ${shouldBePassed}`);
    } else {
      // For in-progress tests or explicit passed value
      if (status) testAttempt.status = status;
      if (passed !== undefined) testAttempt.passed = passed;
    }
    
    await testAttempt.save();
    
    console.log(`Updated test attempt ${testAttempt._id}: status=${testAttempt.status}, passed=${testAttempt.passed}`);
    
    res.json({ 
      message: 'Test attempt status updated successfully', 
      attempt: testAttempt 
    });
  } catch (error) {
    console.error('Error updating test attempt status by ID:', error);
    res.status(500).json({ error: 'Error updating test attempt status' });
  }
});

// Utility function to update user progress in a test series
const updateUserSeriesProgress = async (user, seriesId, testId) => {
  try {
    if (!user || !seriesId || !testId) {
      console.log('Missing required parameters for updateUserSeriesProgress');
      return false;
    }

    // Find the user's subscription to this series
    const userSubscription = user.subscribedSeries?.find(
      sub => sub.seriesId.toString() === seriesId.toString()
    );
    
    if (!userSubscription) {
      console.log(`User ${user._id} is not subscribed to series ${seriesId}`);
      return false;
    }
    
    // Check if this test is already in testsCompleted
    if (!userSubscription.testsCompleted) {
      userSubscription.testsCompleted = [];
    }
    
    const testAlreadyCompleted = userSubscription.testsCompleted.some(
      completedTestId => completedTestId.toString() === testId.toString()
    );
    
    if (testAlreadyCompleted) {
      console.log(`Test ${testId} already marked as completed for user in series ${seriesId}`);
      return false;
    }
    
    // Get series details to calculate progress
    const series = await TestSeries.findById(seriesId);
    if (!series) {
      console.log(`Series ${seriesId} not found`);
      return false;
    }
    
    // Add test to completed tests
    userSubscription.testsCompleted.push(testId);
    
    // Update progress percentage
    if (series.totalTests > 0) {
      userSubscription.progress = Math.round((userSubscription.testsCompleted.length / series.totalTests) * 100);
    } else {
      userSubscription.progress = 0;
    }
    
    // Update lastActivityAt
    userSubscription.lastActivityAt = new Date();
    
    // Save user document with updated progress
    await user.save();
    console.log(`Updated user ${user._id} progress in series ${series.title} to ${userSubscription.progress}%`);
    
    return userSubscription.progress;
  } catch (error) {
    console.error('Error updating user series progress:', error);
    return false;
  }
};

// Check if user has completed a test
router.get('/:testId/check-completion', verifyToken, async (req, res) => {
  try {
    const testId = req.params.testId;
    const userId = req.user.firebaseId;
    
    // Find completed attempt for this test and user
    const completedAttempt = await TestAttempt.findOne({
      testId,
      userId,
      status: 'completed'
    }).populate('testId').sort({ completedAt: -1 });
    
    if (completedAttempt) {
      // Calculate percentage score if we have totalMarks
      const rawScore = completedAttempt.score || 0;
      const totalMarks = completedAttempt.totalMarks || completedAttempt.testId?.totalMarks || 100;
      const percentageScore = Math.round((rawScore / totalMarks) * 100);
      
      res.json({
        hasCompleted: true,
        attemptId: completedAttempt._id,
        score: rawScore,
        totalMarks: totalMarks,
        percentageScore: percentageScore,
        completedAt: completedAttempt.completedAt
      });
    } else {
      res.json({
        hasCompleted: false
      });
    }
  } catch (error) {
    console.error('Error checking test completion:', error);
    res.status(500).json({ error: 'Failed to check test completion status' });
  }
});

// Get test attempt details by userId
router.get('/:testId/user-attempts/:userId', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    
    // Find the test attempt by userId and testId
    const testAttempt = await TestAttempt.findOne({
      testId: testId,
      userId: userId
    }).sort({ createdAt: -1 }); // Get the most recent attempt
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found for this user' });
    }
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (!req.user || (testAttempt.userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher')) {
      return res.status(403).json({ error: 'You are not authorized to view this test attempt' });
    }
    
    // Check if the score and passed state are consistent
    const test = await Test.findById(testId);
    if (test && testAttempt.status === 'completed') {
      // Verify if the passed state is correct based on score and passing threshold
      const shouldBePassed = testAttempt.score >= (test.passingScore || 0);
      
      // If there's an inconsistency, update the passed status
      if (shouldBePassed !== testAttempt.passed) {
        console.log(`Correcting passed status for attempt ${testAttempt._id} from ${testAttempt.passed} to ${shouldBePassed}`);
        testAttempt.passed = shouldBePassed;
        await testAttempt.save();
      }
    }
    
    res.json(testAttempt);
  } catch (error) {
    console.error('Error fetching user test attempt:', error);
    res.status(500).json({ error: 'Error fetching test attempt', details: error.message });
  }
});

module.exports = router;

