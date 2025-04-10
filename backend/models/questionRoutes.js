const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Test = require('../models/questionsSchema');

// Create Test
router.post('/', verifyToken, async (req, res) => {
  try {
    const test = new Test({ ...req.body, createdBy: req.user.uid });
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Get Single Test
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching test' });
  }
});

// Update Test
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Error updating test' });
  }
});

// Delete Test
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting test' });
  }
});

// List All Tests
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, subject } = req.query;
    const query = {};
    if (category) query.category = category;
    if (subject) query.subject = subject;
    const tests = await Test.find(query);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tests' });
  }
});

module.exports = router;