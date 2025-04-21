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
    type: Object,
    default: {},
    validate: {
      validator: function(v) {
        return v !== null && typeof v === 'object';
      },
      message: 'Answers must be an object'
    }
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
  isPassed: {
    type: Boolean,
    default: false
  },
  isImprovement: {
    type: Boolean,
    default: false
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  correctQuestionIds: {
    type: [String],
    default: []
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
  timeTaken: {
    type: Number,
    default: 0
  },
  submissionAttempts: {
    type: Number,
    default: 0
  },
  lastSubmissionAttempt: {
    type: Date
  },
  __v: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create a compound index with unique:false explicitly specified
// This allows multiple attempts for the same user-test combination
testAttemptSchema.index({ testId: 1, userId: 1, createdAt: -1 }, { unique: false });

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
  
  // Ensure isPassed is a boolean (and handle the old field name passed for backward compatibility)
  if (this.isPassed !== undefined) {
    this.isPassed = Boolean(this.isPassed);
    console.log(`[DEBUG] Pre-save hook: Ensuring isPassed is a boolean: ${this.isPassed}`);
  } else if (this.passed !== undefined) {
    // For backwards compatibility, map the old field to the new one
    this.isPassed = Boolean(this.passed);
    console.log(`[DEBUG] Pre-save hook: Mapping old passed field to isPassed: ${this.isPassed}`);
  }
  
  // Ensure isImprovement is a boolean
  if (this.isImprovement !== undefined) {
    this.isImprovement = Boolean(this.isImprovement);
  }
  
  // Set completedAt if status is completed and completedAt is not set
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Calculate time taken if completed
  if (this.status === 'completed' && this.completedAt && this.startedAt && !this.timeTaken) {
    const durationMs = new Date(this.completedAt) - new Date(this.startedAt);
    this.timeTaken = Math.round(durationMs / 1000); // Store in seconds
  }
  
  // Track submission attempts
  if (this.isModified('status') && this.status === 'completed') {
    this.submissionAttempts = (this.submissionAttempts || 0) + 1;
    this.lastSubmissionAttempt = new Date();
  }
  
  next();
});

// Virtual getter for backward compatibility
testAttemptSchema.virtual('passed').get(function() {
  return this.isPassed;
});

// Virtual setter for backward compatibility
testAttemptSchema.virtual('passed').set(function(value) {
  this.isPassed = Boolean(value);
});

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = TestAttempt; 