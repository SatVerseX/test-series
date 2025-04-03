const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const { verifyToken } = require('../middleware/auth');
const admin = require('firebase-admin');

// Get user profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      grade: user.grade,
      subjects: user.subjects,
      role: user.role,
      testHistory: user.testHistory || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.id });
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

// Update user profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, grade, subjects } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.id },
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
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      grade: user.grade,
      subjects: user.subjects,
      role: user.role,
      testHistory: user.testHistory || []
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

// Google Authentication
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        grade: '',
        subjects: [],
        role: 'student'
      });
      await user.save();
    }

    res.json({ 
      message: 'Google authentication successful',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ 
      error: 'Google authentication failed',
      message: error.message
    });
  }
});

module.exports = router; 