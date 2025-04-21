const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const { verifyToken, isAdmin } = require('../middleware/auth');
const admin = require('firebase-admin');
const TestAttempt = require('../models/TestAttempt');

// Register new user (no token verification required)
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', {
      firebaseId: req.body.firebaseId ? 'present' : 'missing',
      email: req.body.email,
      name: req.body.name ? 'present' : 'missing',
      role: req.body.role,
      grade: req.body.grade
    });

    const { firebaseId, email, name, photoURL, role, phoneNumber, grade, subjects } = req.body;

    // Validate required fields
    if (!firebaseId || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields: firebaseId, email, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseId });
    if (existingUser) {
      console.log('User already exists with firebaseId:', firebaseId);
      return res.status(409).json({ error: 'User already exists' });
    }

    // Validate grade for student role
    if (role === 'student' && !grade) {
      return res.status(400).json({ error: 'Grade is required for student accounts' });
    }

    // Create new user
    const user = new User({
      firebaseId,
      email,
      name,
      photoURL,
      role: role || 'student',
      phoneNumber,
      grade: role === 'student' ? grade : undefined,
      subjects: subjects || [],
      testHistory: []
    });

    await user.save();
    console.log('User registered successfully:', {
      id: user._id,
      firebaseId: user.firebaseId,
      email: user.email,
      role: user.role
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email or Firebase ID already exists',
        details: error.keyValue
      });
    }
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Get overall user statistics (admin only)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Fetching overall user statistics...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all users with required fields
    const users = await User.find({}, {
      role: 1,
      lastActive: 1,
      createdAt: 1,
      loginCount: 1,
      testHistory: 1,
      grade: 1,
      subjects: 1
    });
    
    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      activeUsers: {
        last24h: users.filter(user => 
          user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        lastWeek: users.filter(user => 
          user.lastActive && new Date(user.lastActive) > thisWeek
        ).length,
        lastMonth: users.filter(user => 
          user.lastActive && new Date(user.lastActive) > thisMonth
        ).length
      },
      newUsers: {
        today: users.filter(user => user.createdAt && new Date(user.createdAt) > today).length,
        thisWeek: users.filter(user => user.createdAt && new Date(user.createdAt) > thisWeek).length,
        thisMonth: users.filter(user => user.createdAt && new Date(user.createdAt) > thisMonth).length
      },
      roleDistribution: {
        student: users.filter(user => user.role === 'student').length,
        teacher: users.filter(user => user.role === 'teacher').length,
        admin: users.filter(user => user.role === 'admin').length
      },
      activityStats: {
        totalLogins: users.reduce((sum, user) => sum + (user.loginCount || 0), 0),
        averageLoginTime: Math.round(users.reduce((sum, user) => {
          const sessionTime = user.lastActive ? (new Date(user.lastActive) - new Date(user.createdAt)) : 0;
          return sum + sessionTime;
        }, 0) / (users.length || 1) / (60 * 1000)), // Convert to minutes
        testActivity: {
          totalTests: users.reduce((sum, user) => sum + ((user.testHistory || []).length || 0), 0),
          averageScore: Math.round(users.reduce((sum, user) => {
            const scores = (user.testHistory || []).map(test => test.score || 0);
            return sum + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
          }, 0) / (users.length || 1) * 100) / 100,
          completionRate: Math.round(users.reduce((sum, user) => {
            const completed = (user.testHistory || []).filter(test => test.completedAt).length;
            const total = (user.testHistory || []).length;
            return sum + (total ? (completed / total) : 0);
          }, 0) / (users.length || 1) * 100)
        },
        gradeDistribution: users.reduce((acc, user) => {
          if (user.grade) {
            acc[user.grade] = (acc[user.grade] || 0) + 1;
          }
          return acc;
        }, {}),
        subjectPopularity: users.reduce((acc, user) => {
          (user.subjects || []).forEach(subject => {
            acc[subject] = (acc[subject] || 0) + 1;
          });
          return acc;
        }, {})
      }
    };

    console.log('Sending enhanced stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, {
      firebaseId: 1,
      email: 1,
      name: 1,
      phoneNumber: 1,
      grade: 1,
      subjects: 1,
      role: 1,
      lastActive: 1,
      createdAt: 1,
      updatedAt: 1,
      testHistory: 1,
      createdTests: 1
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get user profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log(`Fetching user with firebaseId: ${req.params.id}`);
    const user = await User.findOne({ firebaseId: req.params.id });
    if (!user) {
      console.log(`User not found with firebaseId: ${req.params.id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`User found: ${user._id}`);
    res.json({
      id: user._id,
      firebaseId: user.firebaseId,
      email: user.email,
      name: user.name,
      grade: user.grade,
      subjects: user.subjects,
      role: user.role,
      photoURL: user.photoURL
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error fetching user', details: error.message });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's test history
    const testHistory = user.testHistory || [];
    
    // Calculate statistics
    const totalTests = testHistory.length;
    const averageScore = totalTests > 0 
      ? testHistory.reduce((sum, test) => sum + test.score, 0) / totalTests 
      : 0;
    const completedTests = testHistory.filter(test => test.completedAt).length;

    // Get recent tests (last 3)
    const recentTests = testHistory
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 3);

    // Get upcoming tests based on user's grade and subjects
    const upcomingTests = await Test.find({
      grade: user.grade,
      subject: { $in: user.subjects },
      startDate: { $gt: new Date() }
    }).sort({ startDate: 1 }).limit(2);

    res.json({
      stats: {
        totalTests,
        averageScore: Math.round(averageScore * 100) / 100,
        completedTests
      },
      recentTests,
      upcomingTests
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get user statistics and recent test attempts
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    // Check if the requested user is the logged-in user or the user is an admin
    if (req.params.id !== req.user.firebaseId && !req.dbUser.isAdmin()) {
      return res.status(403).json({ error: 'You can only view your own stats' });
    }

    // Get user and populate test attempts
    const user = await User.findOne({ firebaseId: req.params.id })
      .select('testAttempts');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch test attempts for this user
    const testAttempts = await TestAttempt.find({ userId: req.params.id })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate({
        path: 'testId',
        select: 'title description subject grade passingScore'
      });

    // Calculate stats
    const testsTaken = testAttempts.length;
    const completedTests = testAttempts.filter(attempt => attempt.status === 'completed');
    const averageScore = completedTests.length > 0 
      ? completedTests.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedTests.length 
      : 0;
    
    // Calculate total time spent on tests (in minutes)
    const totalTime = 0; // This would require tracking start and end times
    
    // Format the recently completed tests
    const recentTests = testAttempts.map(attempt => {
      // Get passing threshold from the test, default to 50%
      const passingThreshold = attempt.testId?.passingScore || 50;
      
      // Determine if test was passed based on score >= passing threshold
      // This overrides the stored passed value
      const hasPassed = attempt.status === 'completed' && 
                        typeof attempt.score === 'number' && 
                        attempt.score >= passingThreshold;
      
      return {
        id: attempt._id,
        testId: attempt.testId?._id,
        title: attempt.testId?.title || 'Unknown Test',
        subject: attempt.testId?.subject || 'N/A',
        score: attempt.score || 0,
        passed: hasPassed,  // Use calculated value
        completedAt: attempt.completedAt,
        status: attempt.status,
        correctAnswers: attempt.correctAnswers || 0,
        totalQuestions: attempt.testId?.totalQuestions || 0
      };
    });

    res.json({
      testsTaken,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
      totalTime,
      recentTests
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Error fetching user stats' });
  }
});

// Update user profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, grade, subjects } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseId: req.params.id },
      { 
        name,
        grade,
        subjects: Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()).filter(Boolean)
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      firebaseId: user.firebaseId,
      email: user.email,
      name: user.name,
      grade: user.grade,
      subjects: user.subjects,
      role: user.role,
      testHistory: user.testHistory || [],
      photoURL: user.photoURL
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

// Update user role
router.patch('/:userId/role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    console.log('Updating role for user:', userId, 'to:', role);

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Find user by _id
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role
    user.role = role;
    await user.save();

    console.log('Role updated successfully for user:', userId);

    res.json({ 
      message: 'Role updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      error: 'Error updating user role',
      details: error.message 
    });
  }
});

// Google Authentication
router.post('/auth/google', async (req, res) => {
  try {
    console.log('=== Starting Google Authentication Process ===');
    console.log('Request body:', {
      idToken: req.body.idToken ? 'present (length: ' + req.body.idToken.length + ')' : 'missing',
      name: req.body.name,
      email: req.body.email,
      grade: req.body.grade,
      subjects: req.body.subjects
    });

    const { idToken, name, email, phoneNumber, grade, subjects } = req.body;
    if (!idToken) {
      console.log('ID token missing in request');
      return res.status(400).json({ error: 'ID token is required' });
    }

    console.log('=== Verifying Firebase Token ===');
    // Verify Google token
    let decodedToken;
    try {
      console.log('Calling admin.auth().verifyIdToken()...');
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verification successful:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        issuer: decodedToken.iss,
        audience: decodedToken.aud
      });
    } catch (verifyError) {
      console.error('=== Token Verification Failed ===');
      console.error('Verification error details:', {
        name: verifyError.name,
        message: verifyError.message,
        code: verifyError.code,
        stack: verifyError.stack,
        errorInfo: verifyError.errorInfo
      });
      return res.status(401).json({ 
        error: 'Invalid token',
        message: verifyError.message,
        details: verifyError.errorInfo
      });
    }
    
    console.log('=== Checking User in Database ===');
    // Check if user exists by either firebaseId or email
    let user;
    try {
      user = await User.findOne({
        $or: [
          { firebaseId: decodedToken.uid },
          { email: decodedToken.email }
        ]
      });
      console.log('Database query completed:', user ? 'User found' : 'User not found');

      if (user) {
        // Update the user's Firebase ID if it's different
        if (user.firebaseId !== decodedToken.uid) {
          console.log('Updating Firebase ID for existing user');
          user.firebaseId = decodedToken.uid;
          await user.save();
        }
      }
    } catch (dbError) {
      console.error('Database query error:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code
      });
      throw dbError;
    }
    
    if (!user) {
      console.log('=== Creating New User ===');
      console.log('New user data:', {
        firebaseId: decodedToken.uid,
        email: email || decodedToken.email,
        name: name || decodedToken.name,
        grade: grade || '',
        subjects: subjects || []
      });

      try {
        user = new User({
          firebaseId: decodedToken.uid,
          email: email || decodedToken.email,
          name: name || decodedToken.name || decodedToken.email.split('@')[0],
          grade: grade || '',
          subjects: subjects || [],
          role: 'student',
          photoURL: decodedToken.picture || null
        });

        await user.save();
        console.log('New user saved successfully:', {
          id: user._id,
          firebaseId: user.firebaseId,
          role: user.role,
          photoURL: user.photoURL
        });
      } catch (saveError) {
        console.error('=== Error Saving New User ===');
        console.error('Save error details:', {
          name: saveError.name,
          message: saveError.message,
          code: saveError.code,
          stack: saveError.stack,
          validationErrors: saveError.errors
        });
        throw saveError;
      }
    } else {
      console.log('Existing user found:', {
        id: user._id,
        firebaseId: user.firebaseId,
        role: user.role,
        lastUpdated: user.updatedAt
      });
    }

    console.log('=== Authentication Successful ===');
    res.json({ 
      message: 'Google authentication successful',
      user: {
        id: user._id,
        firebaseId: user.firebaseId,
        email: user.email,
        name: user.name,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error('=== Google Authentication Failed ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      errors: error.errors,
      validationErrors: error.errors ? Object.keys(error.errors) : null
    });

    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
        details: error.keyValue
      });
    }

    res.status(500).json({ 
      error: 'Google authentication failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        errors: error.errors,
        code: error.code
      } : undefined
    });
  }
});

// Get leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, {
      firebaseId: 1,
      email: 1,
      name: 1,
      testHistory: 1,
      photoURL: 1
    });

    const leaderboardData = users.map(user => {
      const testHistory = user.testHistory || [];
      const totalTests = testHistory.length;
      const totalScore = testHistory.reduce((sum, test) => sum + (test.score || 0), 0);
      const averageScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 100) / 100 : 0;
      const totalTime = testHistory.reduce((sum, test) => sum + (test.timeTaken || 0), 0);
      const averageTime = totalTests > 0 ? Math.round(totalTime / totalTests) : 0;

      return {
        _id: user._id,
        firebaseId: user.firebaseId,
        displayName: user.name || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        score: averageScore,
        testsTaken: totalTests,
        averageTime: averageTime
      };
    });

    // Sort by score in descending order
    leaderboardData.sort((a, b) => b.score - a.score);

    // Add rank
    leaderboardData.forEach((user, index) => {
      user.rank = index + 1;
    });

    res.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Login user
router.post('/login', verifyToken, async (req, res) => {
  try {
    const { firebaseId } = req.body;
    
    // Find user by firebaseId
    let user = await User.findOne({ firebaseId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Increment login count
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastActive = new Date();
    await user.save();

    res.json({
      id: user._id,
      firebaseId: user.firebaseId,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade,
      subjects: user.subjects,
      loginCount: user.loginCount,
      lastActive: user.lastActive
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Error logging in user' });
  }
});

// Get user preferences
router.get('/:id/preferences', verifyToken, async (req, res) => {
  try {
    console.log(`Fetching preferences for user with firebaseId: ${req.params.id}`);
    
    // Ensure the user can only access their own preferences
    if (req.user.firebaseId !== req.params.id && !req.dbUser.isAdmin()) {
      console.log(`Access denied: ${req.user.firebaseId} trying to access preferences for ${req.params.id}`);
      return res.status(403).json({ error: 'You can only access your own preferences' });
    }

    const user = await User.findOne({ firebaseId: req.params.id });
    if (!user) {
      console.log(`User not found with firebaseId: ${req.params.id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`User preferences found:`, user.preferences || {});
    res.json(user.preferences || {});
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.params.id
    });
    res.status(500).json({ error: 'Error fetching user preferences', details: error.message });
  }
});

// Update user preferences
router.post('/:id/preferences', verifyToken, async (req, res) => {
  try {
    // Ensure the user can only update their own preferences
    if (req.user.firebaseId !== req.params.id && !req.dbUser.isAdmin()) {
      return res.status(403).json({ error: 'You can only update your own preferences' });
    }

    const user = await User.findOne({ firebaseId: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update preferences with the provided values
    Object.keys(req.body).forEach(key => {
      // Only update allowed preferences
      if (['defaultCategory', 'defaultView', 'defaultSort'].includes(key)) {
        user.preferences[key] = req.body[key];
      }
    });

    await user.save();
    res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Error updating user preferences' });
  }
});

// Add user purchases endpoints

// Get user's purchased test series
router.get('/purchases/test-series', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.firebaseId })
      .populate({
        path: 'purchasedSeries.seriesId',
        select: 'title category totalTests'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return formatted purchased series data
    const purchasedSeries = (user.purchasedSeries || []).map(item => {
      const series = item.seriesId;
      if (!series) return null; // Skip if series was deleted
      
      return {
        _id: series._id,
        title: series.title,
        category: series.category,
        totalTests: series.totalTests,
        expiresAt: item.expiresAt,
        purchaseId: item.purchaseId,
        progress: {
          completedTests: 0 // This would be calculated from test attempts in a real implementation
        }
      };
    }).filter(Boolean); // Remove null entries
    
    res.json(purchasedSeries);
  } catch (err) {
    console.error('Error fetching user purchased series:', err);
    res.status(500).json({ error: 'Failed to fetch purchased series' });
  }
});

// Get user's purchased individual tests
router.get('/purchases/tests', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseId: req.user.firebaseId })
      .populate({
        path: 'purchasedTests.testId',
        select: 'title subject category duration'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return formatted purchased tests data
    const purchasedTests = (user.purchasedTests || []).map(item => {
      const test = item.testId;
      if (!test) return null; // Skip if test was deleted
      
      return {
        _id: test._id,
        title: test.title,
        subject: test.subject,
        category: test.category,
        duration: test.duration,
        expiresAt: item.expiresAt,
        purchaseId: item.purchaseId
      };
    }).filter(Boolean); // Remove null entries
    
    res.json(purchasedTests);
  } catch (err) {
    console.error('Error fetching user purchased tests:', err);
    res.status(500).json({ error: 'Failed to fetch purchased tests' });
  }
});

// Get user's purchases - generic endpoint that returns both test series and individual tests
router.get('/purchases/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== 'test-series' && type !== 'tests') {
      return res.status(400).json({ error: 'Invalid purchase type. Use "test-series" or "tests".' });
    }
    
    // Redirect to the appropriate endpoint
    if (type === 'test-series') {
      return router.handle(req, res, () => {
        req.url = '/purchases/test-series';
      });
    } else {
      return router.handle(req, res, () => {
        req.url = '/purchases/tests';
      });
    }
  } catch (err) {
    console.error(`Error fetching user purchased ${req.params.type}:`, err);
    res.status(500).json({ error: `Failed to fetch purchased ${req.params.type}` });
  }
});

module.exports = router; 