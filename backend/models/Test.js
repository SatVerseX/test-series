const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['mcq', 'trueFalse', 'shortAnswer', 'integer'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  explanation: {
    type: String,
    trim: true
  },
  marks: {
    type: Number,
    required: true,
    min: 1
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: false
  },
  sectionTitle: {
    type: String,
    trim: true,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
    required: false // Make this optional during initial save
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  passingMarks: {
    type: Number,
    default: 0
  }
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0
  },
  sections: [sectionSchema],
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    timeLimit: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    }
  },
  // New fields for paid/free tests
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  accessDuration: {
    type: String,
    default: 'Unlimited'
  },
  // Fields for connecting to test series
  isSeriesTest: {
    type: Boolean, 
    default: false
  },
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries'
  },
  metadata: {
    lastModified: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Calculate total marks and questions before saving
testSchema.pre('save', function(next) {
  try {
    console.log('Pre-save hook started');
    console.log('Test data:', this);
    console.log('Sections:', this.sections);
    console.log('Questions:', this.questions);

    // Calculate section totals
    this.sections.forEach(section => {
      console.log('Processing section:', section);
      
      // Find questions for this section by matching the section title
      const sectionQuestions = this.questions.filter(q => {
        // If question has a sectionId, use it
        if (q.sectionId) {
          return q.sectionId.toString() === section._id.toString();
        }
        // Otherwise, match by section title
        return q.sectionTitle === section.title;
      });
      
      console.log('Found questions for section:', sectionQuestions);
      
      section.totalMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);
      section.totalQuestions = sectionQuestions.length;
      section.passingMarks = Math.ceil(section.totalMarks * (this.passingScore / 100));
      
      console.log('Updated section totals:', {
        totalMarks: section.totalMarks,
        totalQuestions: section.totalQuestions,
        passingMarks: section.passingMarks
      });
      
      // Update sectionId in questions
      sectionQuestions.forEach(q => {
        q.sectionId = section._id;
      });
    });

    // Calculate test totals
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
    this.totalQuestions = this.questions.length;
    this.metadata.lastModified = new Date();

    // Validate paid test data
    if (this.isPaid && this.price <= 0) {
      throw new Error('Paid tests must have a price greater than 0');
    }

    // Validate test series connection
    if (this.isSeriesTest && !this.seriesId) {
      throw new Error('Series tests must have a seriesId');
    }

    console.log('Final test totals:', {
      totalMarks: this.totalMarks,
      totalQuestions: this.totalQuestions
    });

    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Update version number when test is modified
testSchema.pre('findOneAndUpdate', function() {
  this.set({ 'metadata.version': this.get('metadata.version') + 1 });
  this.set({ 'metadata.lastModified': new Date() });
});

// Method to check if test is ready for publishing
testSchema.methods.isReadyForPublishing = function() {
  return (
    this.title &&
    this.description &&
    this.grade &&
    this.subject &&
    this.duration > 0 &&
    this.passingScore >= 0 &&
    this.sections.length > 0 &&
    this.questions.length > 0 &&
    this.totalMarks > 0
  );
};

// Method to calculate statistics
testSchema.methods.calculateStats = function() {
  const stats = {
    totalAttempts: this.attempts,
    averageScore: this.averageScore,
    passRate: this.attempts > 0 ? (this.averageScore >= this.passingScore ? 100 : (this.averageScore / this.passingScore) * 100) : 0,
    questionTypes: {},
    sectionStats: this.sections.map(section => ({
      title: section.title,
      totalQuestions: section.totalQuestions,
      totalMarks: section.totalMarks,
      passingMarks: section.passingMarks
    }))
  };

  // Calculate question type distribution
  this.questions.forEach(q => {
    stats.questionTypes[q.type] = (stats.questionTypes[q.type] || 0) + 1;
  });

  return stats;
};

// Method to get discounted price
testSchema.methods.getDiscountedPrice = function() {
  if (!this.isPaid) return 0;
  if (!this.discount) return this.price;
  return this.price - (this.price * this.discount / 100);
};

// Static method to find tests by creator
testSchema.statics.findByCreator = function(creatorId) {
  return this.find({ createdBy: creatorId });
};

// Static method to find published tests
testSchema.statics.findPublished = function() {
  return this.find({ status: 'published' });
};

// Static method to find tests in a series
testSchema.statics.findBySeries = function(seriesId) {
  return this.find({ isSeriesTest: true, seriesId: seriesId, status: 'published' });
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
