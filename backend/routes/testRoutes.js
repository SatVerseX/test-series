const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, hasPermission, isTeacher } = require('../middleware/auth');
const Test = require('../models/Test');
const TestSeries = require('../models/TestSeries');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { DEFAULT_CATEGORIES, getIconForCategory } = require('../data/defaultCategories');

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

// ✅ Update Test Status (Draft → Published & Vice Versa) - Only Admin or Teacher with permission
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

// ✅ Update Test - Only Admin or Teacher with permission
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

// ✅ Delete Test - Only Admin or Teacher with permission
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

// ✅ Get Tests (with pagination and filters)
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

// ✅ Get Single Test
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

// ✅ Check Test Access
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
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Check if payload is too large
    if (req.body.answers && Object.keys(req.body.answers).length > 500) {
      return res.status(413).json({ 
        message: 'Payload too large. Please send smaller batches.',
        maximumBatchSize: 500
      });
    }
    
    // Validate answers data structure
    const receivedAnswers = req.body.answers || {};
    if (typeof receivedAnswers !== 'object') {
      return res.status(400).json({ message: 'Invalid answers format' });
    }
    
    // Find the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // For access checks
    // ... existing access check code ...

    try {
      // Find the most recent in-progress attempt for this user and test
      let attempt = await TestAttempt.findOne({
        testId: test._id,
        userId: userId,
        status: 'in_progress'
      }).sort({ createdAt: -1 });
  
      // If no in-progress attempt is found, create a new one
      if (!attempt) {
        attempt = new TestAttempt({
          testId: test._id,
          userId: userId,
          answers: {},
          status: 'in_progress',
          startedAt: new Date()
        });
        console.log(`Created new in-progress attempt for user ${userId} on test ${test._id}`);
      }
  
      // Convert existing answers to a plain object if it's a Map
      let existingAnswers = {};
      if (attempt.answers) {
        if (attempt.answers instanceof Map) {
          // Convert Map to plain object
          attempt.answers.forEach((value, key) => {
            existingAnswers[key] = value;
          });
        } else {
          // It's already an object
          existingAnswers = attempt.answers;
        }
      }
  
      // Merge with new answers
      for (const [questionId, answer] of Object.entries(receivedAnswers)) {
        existingAnswers[questionId] = answer;
      }
  
      // Update the attempt with merged answers
      attempt.answers = existingAnswers;
      await attempt.save();
  
      console.log(`Successfully saved progress for attempt ${attempt._id} with ${Object.keys(receivedAnswers).length} new answers`);
      
      // Return minimal response to reduce payload size
      res.json({ 
        message: 'Progress saved successfully',
        attemptId: attempt._id,
        answersCount: Object.keys(existingAnswers).length
      });
    } catch (saveError) {
      console.error('Database error saving progress:', saveError);
      res.status(500).json({ 
        message: 'Error saving progress to database', 
        error: saveError.message 
      });
    }
  } catch (error) {
    console.error('Error in save-progress route:', error);
    res.status(500).json({ 
      message: 'Server error processing save-progress request', 
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

    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const isPassed = score >= (test.passingScore || 60);

    console.log(`Calculated score: ${score}%, correct answers: ${correctAnswers}/${totalQuestions}, passed: ${isPassed}`);

    // Update attempt with final data
    attempt.answers = answers;
    attempt.score = score;
    attempt.correctAnswers = correctAnswers;
    attempt.correctQuestionIds = correctQuestionIds;
    attempt.timeLeft = timeLeft;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.isPassed = isPassed;
    attempt.submissionAttempts = (attempt.submissionAttempts || 0) + 1;
    attempt.lastSubmissionAttempt = new Date();

    // Save the attempt
    await attempt.save();
    console.log(`Successfully saved test attempt ${attempt._id}`);

    // Return success response
    return res.status(200).json({
        message: 'Test submitted successfully', 
      attempt: {
        id: attempt._id,
        score,
        correctAnswers,
        totalQuestions,
        isPassed
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
router.get('/:testId/attempts/:userId', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher') {
      return res.status(403).json({ error: 'You are not authorized to view this test attempt' });
    }
    
    // Find the most recent test attempt for this user and test
    const testAttempt = await TestAttempt.findOne({ 
      testId, 
      userId 
    }).sort({ createdAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
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
    if (req.user.firebaseId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this progress' });
    }

    // Find the most recent in-progress attempt
    const attempt = await TestAttempt.findOne({
      testId,
      userId,
      status: 'in_progress'
    }).sort({ startedAt: -1 });
    
    if (!attempt) {
      return res.status(404).json({ error: 'No test progress found' });
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
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher') {
      return res.status(403).json({ error: 'You are not authorized to update this test attempt' });
    }
    
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

module.exports = router;
