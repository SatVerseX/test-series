const mongoose = require('mongoose');

// Purchase Schema for tracking purchases
const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testSeries: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'free'],
    required: true
  },
  paymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  expiresAt: {
    type: Date
  },
  transactionDetails: {
    gatewayResponse: Object,
    cardLast4: String,
    upiId: String
  },
  accessGranted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ testSeries: 1 });
purchaseSchema.index({ createdAt: -1 });

// Check if purchase is valid (not expired)
purchaseSchema.methods.isValid = function() {
  return this.accessGranted && 
         (this.status === 'completed') && 
         (!this.expiresAt || new Date() < this.expiresAt);
};

// Static method to find valid purchases for a user
purchaseSchema.statics.findValidByUser = function(userId) {
  return this.find({
    user: userId,
    status: 'completed',
    accessGranted: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('testSeries');
};

// Static method to check if user has purchased a test series
purchaseSchema.statics.hasPurchased = async function(userId, testSeriesId) {
  const purchase = await this.findOne({
    user: userId,
    testSeries: testSeriesId,
    status: 'completed',
    accessGranted: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return !!purchase;
};

// Static method to get purchase stats
purchaseSchema.statics.getStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    }
  ]);
};

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase; 