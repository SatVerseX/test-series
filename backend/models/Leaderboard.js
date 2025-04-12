const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  subject: {
    type: String,
    enum: ['all', 'math', 'science', 'english'],
    default: 'all'
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


leaderboardSchema.index({ subject: 1, timeRange: 1, score: -1 });
leaderboardSchema.index({ userId: 1, subject: 1, timeRange: 1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard; 