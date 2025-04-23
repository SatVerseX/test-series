const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const { verifyToken } = require('../middleware/auth');
const TestSeries = require('../models/TestSeries');
const Test = require('../models/Test');

// Get leaderboard with filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      seriesId, 
      testId, 
      timeRange = 'all', 
      page = 1, 
      limit = 10 
    } = req.query;

    // Calculate date range
    let startDate;
    if (timeRange === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Build query
    const query = {
      timeRange
    };

    // Add series or test filter
    if (seriesId) {
      query.seriesId = seriesId;
    } else if (testId) {
      query.testId = testId;
    }

    if (startDate) {
      query.lastUpdated = { $gte: startDate };
    }

    // Get total count
    const total = await Leaderboard.countDocuments(query);

    // Get paginated results with proper sorting
    const leaderboard = await Leaderboard.find(query)
      .sort({ 
        score: -1,
        testsTaken: -1,
        averageTime: 1
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('userId firebaseId displayName email photoURL score testsTaken averageTime seriesId seriesName testId testName timeRange lastUpdated');

    // Add rank to each entry
    const leaderboardWithRank = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: (page - 1) * limit + index + 1
    }));

    res.json({
      leaderboard: leaderboardWithRank,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Update leaderboard entry (called when a test is completed)
router.post('/update', verifyToken, async (req, res) => {
  try {
    const { 
      userId, 
      firebaseId, 
      displayName, 
      email, 
      photoURL, 
      score, 
      timeTaken, 
      seriesId,
      testId 
    } = req.body;

    // Ensure userId is a string (Firebase ID)
    const userIdStr = String(userId);

    // Get series and test details if provided
    let seriesName, testName;
    if (seriesId) {
      const series = await TestSeries.findById(seriesId);
      if (series) {
        seriesName = series.title;
      }
    }
    if (testId) {
      const test = await Test.findById(testId);
      if (test) {
        testName = test.title;
      }
    }

    // Find existing entry using userId as string
    let entry = await Leaderboard.findOne({
      userId: userIdStr,
      seriesId: seriesId || null,
      testId: testId || null,
      timeRange: 'all'
    });

    if (entry) {
      // Update existing entry with proper score calculation
      const newTestsTaken = entry.testsTaken + 1;
      const newTotalScore = (entry.score * entry.testsTaken) + score;
      const newTotalTime = (entry.averageTime * entry.testsTaken) + timeTaken;
      
      entry.testsTaken = newTestsTaken;
      entry.score = newTotalScore / newTestsTaken;
      entry.averageTime = newTotalTime / newTestsTaken;
      entry.lastUpdated = new Date();
    } else {
      // Create new entry with string userId
      entry = new Leaderboard({
        userId: userIdStr,
        firebaseId: firebaseId || userIdStr,
        displayName,
        email,
        photoURL,
        score,
        testsTaken: 1,
        averageTime: timeTaken,
        seriesId: seriesId || null,
        seriesName: seriesName || null,
        testId: testId || null,
        testName: testName || null,
        timeRange: 'all'
      });
    }

    await entry.save();

    // Also update weekly and monthly entries
    const timeRanges = ['week', 'month'];
    for (const timeRange of timeRanges) {
      let timeEntry = await Leaderboard.findOne({
        userId: userIdStr,
        seriesId: seriesId || null,
        testId: testId || null,
        timeRange
      });

      if (timeEntry) {
        const newTestsTaken = timeEntry.testsTaken + 1;
        const newTotalScore = (timeEntry.score * timeEntry.testsTaken) + score;
        const newTotalTime = (timeEntry.averageTime * timeEntry.testsTaken) + timeTaken;
        
        timeEntry.testsTaken = newTestsTaken;
        timeEntry.score = newTotalScore / newTestsTaken;
        timeEntry.averageTime = newTotalTime / newTestsTaken;
        timeEntry.lastUpdated = new Date();
      } else {
        timeEntry = new Leaderboard({
          userId: userIdStr,
          firebaseId: firebaseId || userIdStr,
          displayName,
          email,
          photoURL,
          score,
          testsTaken: 1,
          averageTime: timeTaken,
          seriesId: seriesId || null,
          seriesName: seriesName || null,
          testId: testId || null,
          testName: testName || null,
          timeRange
        });
      }

      await timeEntry.save();
    }

    res.json({ message: 'Leaderboard updated successfully' });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({ error: 'Error updating leaderboard' });
  }
});

// Get test-specific leaderboard
router.get('/test/:testId', verifyToken, async (req, res) => {
  try {
    const testId = req.params.testId;
    const { 
      page = 0, 
      limit = 10, 
      timeRange = 'all' 
    } = req.query;
    
    console.log(`Fetching leaderboard for test ${testId}, timeRange ${timeRange}, page ${page}`);
    
    // Verify test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Calculate date range for filtering
    let startDate;
    if (timeRange === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Build the query
    const query = {
      testId,
      timeRange
    };
    
    if (startDate) {
      query.lastUpdated = { $gte: startDate };
    }
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Get total count
    const total = await Leaderboard.countDocuments(query);
    
    // Get paginated and sorted results
    const leaderboard = await Leaderboard.find(query)
      .sort({ 
        score: -1,
        testsTaken: -1,
        averageTime: 1
      })
      .skip(pageNum * limitNum)
      .limit(limitNum)
      .select('userId firebaseId displayName email photoURL score testsTaken averageTime testId testName timeRange lastUpdated');
    
    // If leaderboard is empty, try to get data from TestAttempt as fallback
    let leaderboardData = [];
    
    if (leaderboard.length === 0) {
      console.log(`No leaderboard entries found for test ${testId}, fetching from TestAttempt`);
      
      // Import TestAttempt if not already available
      const TestAttempt = require('../models/TestAttempt');
      
      // Get completed test attempts for this test
      const attempts = await TestAttempt.find({
        testId,
        status: 'completed'
      })
      .sort({ score: -1, timeTaken: 1 })
      .limit(limitNum)
      .select('userId score totalMarks timeTaken timeLeft completedAt status')
      .populate('testId', 'duration title');
      
      // Transform to leaderboard format
      if (attempts.length > 0) {
        console.log(`Found ${attempts.length} test attempts to use for leaderboard`);
        
        // Try to get user info from database
        const User = require('../models/User');
        
        leaderboardData = await Promise.all(attempts.map(async (attempt, index) => {
          let displayName = 'User';
          let photoURL = null;
          
          // Try to find user in User model
          try {
            const user = await User.findOne({ firebaseId: attempt.userId });
            if (user) {
              displayName = user.displayName || user.name || user.email || 'User';
              photoURL = user.photoURL;
            }
          } catch (userErr) {
            console.log(`Could not find user data for ${attempt.userId}`);
          }
          
          // Calculate time taken from test duration and timeLeft
          let calculatedTimeTaken = attempt.timeTaken || 0;
          
          // If we have test duration and timeLeft, use this for more accurate time taken
          if (attempt.testId && attempt.testId.duration && typeof attempt.timeLeft === 'number') {
            const testDurationSeconds = attempt.testId.duration * 60; // Convert minutes to seconds
            calculatedTimeTaken = testDurationSeconds - attempt.timeLeft;
            calculatedTimeTaken = Math.max(1, calculatedTimeTaken); // Ensure at least 1 second
            console.log(`Calculated time taken for ${attempt._id}: ${calculatedTimeTaken}s from duration ${testDurationSeconds}s - timeLeft ${attempt.timeLeft}s`);
          }
          
          return {
            _id: `${attempt._id}`,
            userId: attempt.userId,
            firebaseId: attempt.userId,
            displayName,
            photoURL,
            score: attempt.score || 0,
            accuracy: attempt.totalMarks ? Math.round((attempt.score / attempt.totalMarks) * 100) : attempt.score || 0,
            averageTime: calculatedTimeTaken,
            timeTaken: calculatedTimeTaken,
            completedAt: attempt.completedAt || new Date(),
            updatedAt: attempt.completedAt || new Date(),
            testId,
            testName: attempt.testId ? attempt.testId.title : test.title,
            rank: index + 1
          };
        }));
      }
    } else {
      // Add rank to each entry from regular leaderboard
      leaderboardData = leaderboard.map((entry, index) => {
        // Safely convert to object if it's a Mongoose document
        const entryObj = entry.toObject ? entry.toObject() : entry;
        return {
          ...entryObj,
          rank: pageNum * limitNum + index + 1
        };
      });
    }
    
    // Get current user's rank if applicable
    let userRank = null;
    if (req.user) {
      const userId = req.user.firebaseId;
      
      // Find user's entry
      const userEntry = await Leaderboard.findOne({
        testId,
        timeRange,
        firebaseId: userId
      });
      
      if (userEntry) {
        // Count number of entries with better score
        const betterScores = await Leaderboard.countDocuments({
          testId,
          timeRange,
          score: { $gt: userEntry.score }
        });
        
        userRank = {
          rank: betterScores + 1,
          score: userEntry.score,
          testsTaken: userEntry.testsTaken,
          accuracy: Math.round(userEntry.score) // Use score directly as it's already a percentage in the Leaderboard model
        };
      } else if (leaderboardData.length > 0) {
        // Check if user is in the transformed data from TestAttempt
        const userInTransformed = leaderboardData.find(entry => entry.userId === userId);
        if (userInTransformed) {
          userRank = {
            rank: userInTransformed.rank,
            score: userInTransformed.score,
            accuracy: userInTransformed.accuracy,
            timeTaken: userInTransformed.timeTaken,
            testsTaken: 1
          };
        }
      }
    }
    
    res.json({
      leaderboard: leaderboardData,
      userRank,
      totalPages: Math.ceil(total > 0 ? total : leaderboardData.length / limitNum),
      total: total > 0 ? total : leaderboardData.length,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching test leaderboard:', error);
    res.status(500).json({ error: 'Error fetching test leaderboard' });
  }
});

module.exports = router; 