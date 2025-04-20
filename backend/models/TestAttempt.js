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
  passed: {
    type: Boolean,
    default: false
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeLeft: {
    type: Number,
    default: 0
  },
  __v: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Modified: Create a compound index but NOT unique, to allow multiple attempts
// This allows finding the latest attempt for a user-test combination quickly
testAttemptSchema.index({ testId: 1, userId: 1, createdAt: -1 });

// Enhanced pre-save hook for data validation and type conversion
testAttemptSchema.pre('save', function(next) {
  // Convert score to number if it's not already
  if (this.score !== undefined) {
    this.score = Number(this.score);
    console.log(`[DEBUG] Pre-save hook: Ensuring score is a number: ${this.score}`);
  }
  
  // Convert correctAnswers to number if it's not already
  if (this.correctAnswers !== undefined) {
    this.correctAnswers = Number(this.correctAnswers);
    console.log(`[DEBUG] Pre-save hook: Ensuring correctAnswers is a number: ${this.correctAnswers}`);
  }
  
  // Ensure passed is a boolean
  if (this.passed !== undefined) {
    this.passed = Boolean(this.passed);
    console.log(`[DEBUG] Pre-save hook: Ensuring passed is a boolean: ${this.passed}`);
  }
  
  // Set completedAt if status is completed and completedAt is not set
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = TestAttempt; 