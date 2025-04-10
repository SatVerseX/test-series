const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, hasPermission, isTeacher } = require('../middleware/auth');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');

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

    // Toggle status
    test.status = test.status === 'draft' ? 'published' : 'draft';
    await test.save();

    res.json({ message: `Test marked as ${test.status}`, status: test.status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
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

    // Update test fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy' && key !== 'status') {
        test[key] = req.body[key];
      }
    });

    await test.save();
    res.json({ message: 'Test updated successfully', test });
  } catch (error) {
    res.status(500).json({ message: 'Error updating test', error });
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

    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test', error });
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
      sortOrder = 'desc'
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
    
    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Error fetching test' });
  }
});

// ✅ Save Test Progress
router.post('/:id/save-progress', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Find or create test attempt
    let attempt = await TestAttempt.findOne({
      testId: test._id,
      userId: req.user.firebaseId
    });

    if (!attempt) {
      attempt = new TestAttempt({
        testId: test._id,
        userId: req.user.firebaseId,
        answers: req.body.answers || {},
        status: 'in_progress'
      });
    } else {
      attempt.answers = {
        ...attempt.answers,
        ...req.body.answers
      };
    }

    await attempt.save();
    res.json({ message: 'Progress saved successfully', attempt });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ message: 'Error saving progress', error: error.message });
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

module.exports = router;
