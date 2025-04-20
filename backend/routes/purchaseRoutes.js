const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const TestSeries = require('../models/TestSeries');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Create a new purchase (initiate checkout)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { testSeriesId, paymentMethod } = req.body;
    
    // Validate required fields
    if (!testSeriesId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({ error: 'Test series not found' });
    }
    
    // Check if user already has a valid purchase for this test series
    const existingPurchase = await Purchase.findOne({
      user: req.user._id,
      testSeries: testSeriesId,
      status: 'completed',
      accessGranted: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    if (existingPurchase) {
      return res.status(409).json({ 
        error: 'You have already purchased this test series',
        purchase: existingPurchase
      });
    }
    
    // Calculate amount with discount
    const amount = testSeries.isPaid ? testSeries.getDiscountedPrice() : 0;
    
    // Set expiration date based on duration
    let expiresAt = null;
    if (testSeries.duration !== 'Unlimited') {
      const durationMatch = testSeries.duration.match(/(\d+)\s+(months?|days?|years?)/i);
      if (durationMatch) {
        const [, value, unit] = durationMatch;
        expiresAt = new Date();
        if (unit.startsWith('month')) {
          expiresAt.setMonth(expiresAt.getMonth() + parseInt(value));
        } else if (unit.startsWith('day')) {
          expiresAt.setDate(expiresAt.getDate() + parseInt(value));
        } else if (unit.startsWith('year')) {
          expiresAt.setFullYear(expiresAt.getFullYear() + parseInt(value));
        }
      }
    }
    
    // Create the purchase record (initially with pending status)
    const purchase = new Purchase({
      user: req.user._id,
      testSeries: testSeriesId,
      amount,
      discountApplied: testSeries.discount || 0,
      paymentMethod: amount === 0 ? 'free' : paymentMethod,
      status: amount === 0 ? 'completed' : 'pending', // Free series are automatically completed
      expiresAt,
      accessGranted: amount === 0, // Free series get immediate access
    });
    
    await purchase.save();
    
    // If it's a free series, update user's purchasedSeries array
    if (amount === 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          purchasedSeries: {
            seriesId: testSeriesId,
            purchaseId: purchase._id,
            expiresAt
          }
        }
      });
      
      // Increment the students count for the test series
      await TestSeries.findByIdAndUpdate(testSeriesId, {
        $inc: { students: 1 }
      });
    }
    
    res.status(201).json({
      purchase,
      paymentRequired: amount > 0,
      // In a real app, you would include payment gateway details here
      // e.g., paymentIntent, clientSecret, etc.
    });
  } catch (err) {
    console.error('Error creating purchase:', err);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// Complete a purchase (after payment)
router.post('/:id/complete', verifyToken, async (req, res) => {
  try {
    const { paymentId, paymentDetails } = req.body;
    
    // Find the purchase
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    // Verify user ownership
    if (purchase.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this purchase' });
    }
    
    // Update purchase details
    purchase.status = 'completed';
    purchase.paymentId = paymentId;
    purchase.accessGranted = true;
    
    if (paymentDetails) {
      purchase.transactionDetails = {
        gatewayResponse: paymentDetails,
        cardLast4: paymentDetails.cardLast4,
        upiId: paymentDetails.upiId
      };
    }
    
    await purchase.save();
    
    // Add to user's purchasedSeries
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        purchasedSeries: {
          seriesId: purchase.testSeries,
          purchaseId: purchase._id,
          expiresAt: purchase.expiresAt
        }
      }
    });
    
    // Increment the students count for the test series
    await TestSeries.findByIdAndUpdate(purchase.testSeries, {
      $inc: { students: 1 }
    });
    
    res.json({
      success: true,
      purchase
    });
  } catch (err) {
    console.error('Error completing purchase:', err);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Get user's purchase history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id })
      .populate('testSeries', 'title category isPaid price discount')
      .sort({ createdAt: -1 });
    
    res.json(purchases);
  } catch (err) {
    console.error('Error fetching purchase history:', err);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

// Get purchase by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('testSeries', 'title category isPaid price discount duration');
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    // Verify user ownership or admin
    if (purchase.user.toString() !== req.user._id.toString() && !req.user.isAdmin()) {
      return res.status(403).json({ error: 'Not authorized to view this purchase' });
    }
    
    res.json(purchase);
  } catch (err) {
    console.error('Error fetching purchase:', err);
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

// Admin: get all purchases
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const purchases = await Purchase.find(query)
      .populate('user', 'name email')
      .populate('testSeries', 'title category isPaid price')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Purchase.countDocuments(query);
    
    res.json({
      purchases,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching purchases:', err);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Admin: get purchase statistics
router.get('/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = await Purchase.getStats();
    
    // Calculate revenue by category
    const revenueByCategory = await Purchase.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $lookup: {
          from: 'testseries',
          localField: 'testSeries',
          foreignField: '_id',
          as: 'seriesDetails'
        }
      },
      {
        $unwind: '$seriesDetails'
      },
      {
        $group: {
          _id: '$seriesDetails.category',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);
    
    // Monthly revenue trend
    const monthlyRevenue = await Purchase.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.json({
      overall: stats,
      byCategory: revenueByCategory,
      monthly: monthlyRevenue
    });
  } catch (err) {
    console.error('Error fetching purchase statistics:', err);
    res.status(500).json({ error: 'Failed to fetch purchase statistics' });
  }
});

module.exports = router; 