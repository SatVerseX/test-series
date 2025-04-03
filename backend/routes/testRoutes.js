const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Test = require('../models/Test');

// Get all tests
router.get('/', verifyToken, async (req, res) => {
  try {
    const { grade, subject } = req.query;
    let query = {};
    
    if (grade) query.grade = grade;
    if (subject) query.subject = subject;
    
    const tests = await Test.find(query);
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Error fetching tests' });
  }
});

// Get a single test
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Error fetching test' });
  }
});

// Create a new test
router.post('/', verifyToken, async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Error creating test' });
  }
});

// Update a test
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Error updating test' });
  }
});

// Delete a test
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Error deleting test' });
  }
});

module.exports = router; 