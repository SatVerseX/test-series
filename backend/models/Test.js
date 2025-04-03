const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      required: true,
      trim: true
    }],
    correctAnswer: {
      type: String,
      required: true,
      trim: true
    },
    explanation: {
      type: String,
      trim: true
    }
  }],
  duration: {
    type: Number, // in minutes
    required: true
  },
  passingScore: {
    type: Number,
    required: true,
    default: 60
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
testSchema.index({ grade: 1, subject: 1 });
testSchema.index({ startDate: 1, endDate: 1 });

// Export the model directly
module.exports = mongoose.model('Test', testSchema); 