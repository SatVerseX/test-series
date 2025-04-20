const mongoose = require('mongoose');

const testSeriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String
  },
  category: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
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
    default: 0
  },
  duration: {
    type: String,
    default: 'Unlimited'
  },
  totalTests: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }],
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  popular: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to ensure totalTests matches tests array length
testSeriesSchema.pre('save', function(next) {
  // If tests array exists, update totalTests to match its length
  if (this.tests && Array.isArray(this.tests)) {
    try {
      // Remove any duplicates from the tests array without additional conversion
      const uniqueTestIds = [...new Set(this.tests.map(id => id.toString()))];
      
      // Keep the original ObjectIds if they exist, otherwise use new ObjectIds
      this.tests = uniqueTestIds.map(idStr => {
        if (typeof idStr === 'string') {
          try {
            return new mongoose.Types.ObjectId(idStr);
          } catch (e) {
            console.error(`Invalid ObjectId: ${idStr}`, e);
            return null;
          }
        }
        return idStr;
      }).filter(id => id !== null);
      
      // Update totalTests count
      this.totalTests = this.tests.length;
      console.log(`Pre-save: Updated totalTests to ${this.totalTests} for series ${this._id}`);
    } catch (error) {
      console.error('Error in pre-save hook:', error);
      // Continue with save even if there's an error in the hook
    }
  }
  
  next();
});

// Method to get discounted price
testSeriesSchema.methods.getDiscountedPrice = function() {
  if (!this.discount || this.discount === 0) {
    return this.price;
  }
  return this.price * (1 - this.discount / 100);
};

module.exports = mongoose.model('TestSeries', testSeriesSchema); 