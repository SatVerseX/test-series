const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'DESCRIPTIVE'], required: true },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: { type: String },
  marks: { type: Number, required: true },
  subject: { type: String, required: true },
  topic: String
});

// Middleware for validation
questionSchema.pre('save', function (next) {
  if (this.type === 'MCQ' && (!this.options || this.options.length === 0)) {
    return next(new Error("MCQ questions must have options."));
  }

  if (this.type === 'MCQ' && !this.options.some(option => option.isCorrect)) {
    return next(new Error("MCQ questions must have at least one correct option."));
  }

  if (this.type === 'DESCRIPTIVE' && !this.correctAnswer) {
    return next(new Error("Descriptive questions must have a correct answer."));
  }

  next();
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  grade: { type: String, required: true, enum: ["10th", "11th", "12th"] },
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  totalMarks: { type: Number, required: true },
  questions: [questionSchema],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Better Indexing
testSchema.index({ grade: 1, subject: 1 });
testSchema.index({ startDate: 1, endDate: 1 });
testSchema.index({ isActive: 1 });

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    trim: true,
    default: ''
  },
  subjects: [{
    type: String,
    trim: true
  }],
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  testHistory: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    },
    score: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model directly
module.exports = mongoose.model('User', userSchema);
