const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const { verifyToken } = require('../middleware/auth');

// Get leaderboard with filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { subject = 'all', timeRange = 'all', page = 1, limit = 10 } = req.query;

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
      subject,
      timeRange
    };

    if (startDate) {
      query.lastUpdated = { $gte: startDate };
    }

    // Get total count
    const total = await Leaderboard.countDocuments(query);

    // Get paginated results
    const leaderboard = await Leaderboard.find(query)
      .sort({ score: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('userId firebaseId displayName email photoURL score testsTaken averageTime');

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
    const { userId, firebaseId, displayName, email, photoURL, score, timeTaken, subject } = req.body;

    // Find existing entry
    let entry = await Leaderboard.findOne({
      userId,
      subject,
      timeRange: 'all'
    });

    if (entry) {
      // Update existing entry
      entry.testsTaken += 1;
      entry.score = ((entry.score * (entry.testsTaken - 1)) + score) / entry.testsTaken;
      entry.averageTime = ((entry.averageTime * (entry.testsTaken - 1)) + timeTaken) / entry.testsTaken;
      entry.lastUpdated = new Date();
    } else {
      // Create new entry
      entry = new Leaderboard({
        userId,
        firebaseId,
        displayName,
        email,
        photoURL,
        score,
        testsTaken: 1,
        averageTime: timeTaken,
        subject,
        timeRange: 'all'
      });
    }

    await entry.save();

    // Also update weekly and monthly entries
    const timeRanges = ['week', 'month'];
    for (const timeRange of timeRanges) {
      let timeEntry = await Leaderboard.findOne({
        userId,
        subject,
        timeRange
      });

      if (timeEntry) {
        timeEntry.testsTaken += 1;
        timeEntry.score = ((timeEntry.score * (timeEntry.testsTaken - 1)) + score) / timeEntry.testsTaken;
        timeEntry.averageTime = ((timeEntry.averageTime * (timeEntry.testsTaken - 1)) + timeTaken) / timeEntry.testsTaken;
        timeEntry.lastUpdated = new Date();
      } else {
        timeEntry = new Leaderboard({
          userId,
          firebaseId,
          displayName,
          email,
          photoURL,
          score,
          testsTaken: 1,
          averageTime: timeTaken,
          subject,
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

module.exports = router; 