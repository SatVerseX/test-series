const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  firebaseId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  photoURL: {
    type: String
  },
  score: {
    type: Number,
    default: 0
  },
  testsTaken: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number,
    default: 0
  },
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries'
  },
  seriesName: {
    type: String
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  testName: {
    type: String
  },
  timeRange: {
    type: String,
    enum: ['all', 'week', 'month'],
    default: 'all'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

leaderboardSchema.index({ seriesId: 1, timeRange: 1, score: -1 });
leaderboardSchema.index({ testId: 1, timeRange: 1, score: -1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard; 