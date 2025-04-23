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
  firebaseId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  grade: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  subjects: [{
    type: String
  }],
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Admin specific fields
  adminPermissions: {
    canCreateTests: { type: Boolean, default: false },
    canEditTests: { type: Boolean, default: false },
    canDeleteTests: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false }
  },
  // Teacher specific fields
  teacherSubjects: [{
    type: String,
    trim: true
  }],
  teacherGrades: [{
    type: String,
    trim: true
  }],
  // Test history for students
  testHistory: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    },
    score: Number,
    completedAt: Date,
    timeTaken: Number
  }],
  // Tests created by admin/teacher
  createdTests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  }],
  // Purchased test series
  purchasedSeries: [{
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSeries'
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    progress: {
      testsAttempted: { type: Number, default: 0 },
      testsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    }
  }],
  // Subscribed free test series
  subscribedSeries: [{
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSeries'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    progress: { type: Number, default: 0 },
    testsCompleted: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    }],
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Purchased individual tests
  purchasedTests: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    completed: { type: Boolean, default: false },
    score: { type: Number }
  }],
  // Profile settings
  profileSettings: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  // User preferences
  preferences: {
    defaultCategory: { type: String, default: 'all' },
    defaultView: { type: String, enum: ['card', 'list'], default: 'card' },
    defaultSort: { type: String, default: 'newest' },
    lastViewedTests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    }]
  },
  // Account status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  photoURL: String
}, { timestamps: true });

// Update lastActive on save
userSchema.pre('save', function(next) {
  // Only update lastActive if the document is being modified
  if (this.isModified()) {
    this.lastActive = new Date();
  }
  next();
});

// Set default admin permissions based on role
userSchema.pre('save', function(next) {
  if (this.role === 'admin') {
    this.adminPermissions = {
      canCreateTests: true,
      canEditTests: true,
      canDeleteTests: true,
      canManageUsers: true,
      canViewAnalytics: true
    };
  } else if (this.role === 'teacher') {
    this.adminPermissions = {
      canCreateTests: true,
      canEditTests: true,
      canDeleteTests: false,
      canManageUsers: false,
      canViewAnalytics: true
    };
  }
  next();
});

// Helper method to check if user has admin permissions
userSchema.methods.hasAdminPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.adminPermissions[permission] === true;
};

// Helper method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Helper method to check if user is teacher
userSchema.methods.isTeacher = function() {
  return this.role === 'teacher';
};

// Helper method to check if user has purchased a test series
userSchema.methods.hasPurchased = function(seriesId) {
  return this.purchasedSeries.some(purchase => {
    // Check if purchase is valid (not expired)
    const isValid = !purchase.expiresAt || new Date() < purchase.expiresAt;
    return purchase.seriesId.toString() === seriesId.toString() && isValid;
  });
};

// Export the model directly
module.exports = mongoose.model('User', userSchema);
