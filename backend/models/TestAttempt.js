const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  answers: {
    type: Map,
    of: String,
    default: {}
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  score: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add index for faster queries
testAttemptSchema.index({ testId: 1, userId: 1 }, { unique: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = TestAttempt; 