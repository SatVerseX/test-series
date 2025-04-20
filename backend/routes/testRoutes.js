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

// ✅ Submit Test Attempt
router.post('/:id/attempt', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if test is paid and user has access
    if (test.isPaid) {
      let hasAccess = false;
      
      // If req.dbUser is not available (which happens sometimes),
      // check if user is admin or teacher based on role property directly
      if (!req.dbUser) {
        // Add user to req.dbUser for later use
        req.dbUser = req.user;
      }
      
      // Check if user is admin/teacher or creator
      if ((req.dbUser.isAdmin && req.dbUser.isAdmin()) || 
          (req.dbUser.isTeacher && req.dbUser.isTeacher()) || 
          req.dbUser.role === 'admin' ||
          req.dbUser.role === 'teacher' ||
          test.createdBy === req.user.firebaseId) {
        hasAccess = true;
      } else if (test.isSeriesTest && test.seriesId) {
        // Check if user has purchased the series
        if (req.dbUser.hasPurchased) {
          hasAccess = await req.dbUser.hasPurchased(test.seriesId);
        } else {
          // Fallback if method is missing
          const purchasedSeries = req.dbUser.purchasedSeries || [];
          hasAccess = purchasedSeries.some(p => 
            p.seriesId && p.seriesId.toString() === test.seriesId.toString()
          );
        }
      } else {
        // Check if user has purchased the individual test
        if (Purchase) {
          hasAccess = await Purchase.hasPurchased(req.dbUser._id, test._id);
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ 
          message: 'You need to purchase this test to submit it.',
          isPaid: true
        });
      }
    }

    // Create a new test attempt instead of finding/updating
    // This allows users to retake tests multiple times
    const attempt = new TestAttempt({
      testId: test._id,
      userId: req.user.firebaseId,
      answers: req.body.answers || {},
      status: 'completed',
      startedAt: req.body.startedAt || new Date()
    });
    
    console.log(`Created new attempt for user ${req.user.firebaseId} on test ${test._id}`);
    console.log('Received answers:', Object.keys(req.body.answers || {}).length);
    
    try {
      // Calculate score
      let totalQuestions = test.questions.length || 0;
      let correctAnswers = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;

      // For each question in the test
      for (const question of test.questions) {
        const questionMarks = question.marks || 1; // Default to 1 mark if not specified
        totalMarks += questionMarks;
        
        const userAnswer = attempt.answers[question._id];
        
        // Skip if no answer provided
        if (!userAnswer) {
          continue;
        }

        // Check if answer is correct based on question type
        let isCorrect = false;
        if (question.type === 'mcq' || question.type === 'trueFalse') {
          // For MCQ and True/False, ensure case-insensitive comparison
          const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
          const normalizedCorrectAnswer = String(question.correctAnswer).toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        } else if (question.type === 'shortAnswer') {
          // For short answer, do a case-insensitive comparison
          const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
          const normalizedCorrectAnswer = String(question.correctAnswer).toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        } else if (question.type === 'integer') {
          // For integer, handle potential parsing errors
          try {
            const userInt = parseInt(userAnswer);
            const correctInt = parseInt(question.correctAnswer);
            isCorrect = !isNaN(userInt) && !isNaN(correctInt) && userInt === correctInt;
          } catch (parseError) {
            console.error('Error parsing integer:', parseError);
            isCorrect = false;
          }
        }
        
        if (isCorrect) {
          correctAnswers++;
          obtainedMarks += questionMarks;
        }
      }

      // Calculate score as percentage
      const score = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
      const passed = score >= (test.passingScore || 0);
      
      console.log('Scoring results:');
      console.log('- Total questions:', totalQuestions);
      console.log('- Correct answers:', correctAnswers);
      console.log('- Total marks:', totalMarks);
      console.log('- Obtained marks:', obtainedMarks);
      console.log('- Score:', score + '%');
      console.log('- Passing score:', test.passingScore + '%');
      console.log('- Passed:', passed);

      // Update the attempt with score details before saving
      attempt.score = Number(score);
      attempt.correctAnswers = Number(correctAnswers);
      attempt.passed = Boolean(passed);
      attempt.completedAt = new Date();
      
      // Save the attempt
      await attempt.save();
      console.log('Successfully saved test attempt with ID:', attempt._id);
      
      // Update test statistics
      test.attempts += 1;
      test.averageScore = ((test.averageScore * (test.attempts - 1)) + score) / test.attempts;
      await test.save();

      // Update user test history
      if (req.dbUser) {
        req.dbUser.testHistory.push({
          testId: test._id,
          score,
          completedAt: new Date(),
          timeTaken: req.body.timeTaken || 0
        });
        
        await req.dbUser.save();
      }

      // If test is part of a series, update progress in the user's purchasedSeries
      if (test.isSeriesTest && test.seriesId && req.dbUser) {
        const purchasedSeriesIndex = req.dbUser.purchasedSeries.findIndex(
          purchase => purchase.seriesId.toString() === test.seriesId.toString()
        );
        
        if (purchasedSeriesIndex >= 0) {
          const purchaseSeries = req.dbUser.purchasedSeries[purchasedSeriesIndex];
          
          // Update progress
          purchaseSeries.progress.testsAttempted += 1;
          if (passed) {
            purchaseSeries.progress.testsCompleted += 1;
          }
          
          // Update average score
          const currentTotal = purchaseSeries.progress.averageScore * 
                              (purchaseSeries.progress.testsAttempted - 1);
          purchaseSeries.progress.averageScore = 
            (currentTotal + score) / purchaseSeries.progress.testsAttempted;
          
          await req.dbUser.save();
        }
      }

      res.json({ 
        message: 'Test submitted successfully', 
        attempt: attempt,
        score,
        passed,
        totalQuestions,
        correctAnswers
      });
    } catch (scoringError) {
      console.error('Error in test scoring process:', scoringError);
      res.status(500).json({ 
        message: 'Error scoring test', 
        error: scoringError.message,
        stack: scoringError.stack
      });
    }
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ 
      message: 'Error submitting test', 
      error: error.message,
      stack: error.stack
    });
  }
});

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

// Get test progress
router.get('/:id/progress/:userId', verifyToken, async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher') {
      return res.status(403).json({ error: 'You are not authorized to view this test progress' });
    }
    
    // Find the most recent in-progress attempt for this user and test
    const testAttempt = await TestAttempt.findOne({ 
      testId: id, 
      userId,
      status: 'in_progress'
    }).sort({ createdAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'No test progress found' });
    }
    
    res.json(testAttempt);
  } catch (error) {
    console.error('Error fetching test progress:', error);
    res.status(500).json({ error: 'Error fetching test progress', details: error.message });
  }
});

// Update test attempt status
router.put('/:testId/attempts/:userId/update-status', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const { passed } = req.body;
    
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
    
    // Update the passed status
    testAttempt.passed = passed;
    await testAttempt.save();
    
    console.log(`Updated test attempt ${testAttempt._id} passed status to ${passed}`);
    
    res.json({ 
      message: 'Test attempt status updated successfully', 
      attempt: testAttempt 
    });
  } catch (error) {
    console.error('Error updating test attempt status:', error);
    res.status(500).json({ error: 'Error updating test attempt status' });
  }
});

// Manual update of test attempt score - emergency fallback endpoint
router.put('/:testId/attempts/:userId/update-score', verifyToken, async (req, res) => {
  try {
    const { testId, userId } = req.params;
    const { score, correctAnswers, passed } = req.body;
    
    // Check if the user is authorized (admin, test owner, or the user who took the test)
    if (userId !== req.user.firebaseId && !req.dbUser.isAdmin() && req.dbUser.role !== 'teacher') {
      return res.status(403).json({ error: 'You are not authorized to update this test attempt' });
    }
    
    console.log(`[DEBUG] Received manual score update for test ${testId}, user ${userId}`);
    console.log(`[DEBUG] - Score: ${score}, correctAnswers: ${correctAnswers}, passed: ${passed}`);
    
    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({ 
      testId, 
      userId 
    }).sort({ completedAt: -1 });
    
    if (!testAttempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }
    
    console.log(`[DEBUG] Found test attempt ${testAttempt._id}`);
    
    // Try multiple methods to update the score
    
    // Method 1: Direct object property update and save
    testAttempt.score = Number(score);
    testAttempt.correctAnswers = Number(correctAnswers);
    testAttempt.passed = Boolean(passed);
    
    try {
      await testAttempt.save();
      console.log(`[DEBUG] Method 1 success: Updated via save()`);
    } catch (saveError) {
      console.error(`[DEBUG] Method 1 failed:`, saveError);
    }
    
    // Method 2: Mongoose updateOne
    try {
      const updateResult = await TestAttempt.updateOne(
        { _id: testAttempt._id },
        { 
          $set: { 
            score: Number(score),
            correctAnswers: Number(correctAnswers),
            passed: Boolean(passed)
          }
        }
      );
      console.log(`[DEBUG] Method 2 success: Mongoose updateOne result:`, updateResult);
    } catch (updateError) {
      console.error(`[DEBUG] Method 2 failed:`, updateError);
    }
    
    // Method 3: Direct MongoDB collection update
    try {
      const directResult = await TestAttempt.collection.updateOne(
        { _id: testAttempt._id },
        { 
          $set: { 
            score: Number(score),
            correctAnswers: Number(correctAnswers),
            passed: Boolean(passed)
          }
        }
      );
      console.log(`[DEBUG] Method 3 success: Direct MongoDB update result:`, directResult);
    } catch (directError) {
      console.error(`[DEBUG] Method 3 failed:`, directError);
    }
    
    // Verify the update
    const updatedAttempt = await TestAttempt.findById(testAttempt._id);
    console.log(`[DEBUG] Verification - updated attempt:`, {
      score: updatedAttempt.score,
      correctAnswers: updatedAttempt.correctAnswers,
      passed: updatedAttempt.passed
    });
    
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
