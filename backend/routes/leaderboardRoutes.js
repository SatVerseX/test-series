const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('firebase-admin');

// Middleware to verify Firebase ID token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get leaderboard data
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { subject, timeRange, page = 1, limit = 10 } = req.query;
    
    // Build the match query based on filters
    const matchQuery = {};
    
    // Filter by subject if specified
    if (subject && subject !== 'all') {
      matchQuery['testHistory.subject'] = subject;
    }
    
    // Filter by time range if specified
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      matchQuery['testHistory.completedAt'] = { $gte: startDate };
    }

    // First, get all users with test history
    const users = await User.find({
      'testHistory.0': { $exists: true } // Users who have at least one test
    });

    // Process the data in memory for more flexibility
    const processedData = users.map(user => {
      // Filter test history based on subject and time range
      let filteredTests = user.testHistory;
      
      if (subject && subject !== 'all') {
        filteredTests = filteredTests.filter(test => test.subject === subject);
      }
      
      if (timeRange && timeRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        filteredTests = filteredTests.filter(test => 
          new Date(test.completedAt) >= startDate
        );
      }

      // Calculate statistics
      const totalTests = filteredTests.length;
      const averageScore = totalTests > 0 
        ? filteredTests.reduce((sum, test) => sum + test.score, 0) / totalTests 
        : 0;

      return {
        userId: user._id,
        name: user.name,
        grade: user.grade,
        averageScore: Math.round(averageScore * 100) / 100,
        totalTests
      };
    })
    .filter(user => user.totalTests > 0) // Only include users with tests
    .sort((a, b) => b.averageScore - a.averageScore); // Sort by average score

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = processedData.slice(startIndex, endIndex);

    res.json({
      leaderboard: paginatedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(processedData.length / limit),
        totalItems: processedData.length
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      message: 'Error fetching leaderboard', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 