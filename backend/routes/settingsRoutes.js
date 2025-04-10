const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all settings (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// Get public settings
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.find({ isPublic: true });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ error: 'Error fetching public settings' });
  }
});

// Get settings by category
router.get('/category/:category', verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await Settings.find({ category: req.params.category });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({ error: 'Error fetching settings by category' });
  }
});

// Update settings (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    const updatePromises = settings.map(async (setting) => {
      const { key, value } = setting;
      
      if (!key || value === undefined) {
        throw new Error('Each setting must have a key and value');
      }

      return Settings.findOneAndUpdate(
        { key },
        { value },
        { new: true, upsert: false }
      );
    });

    const updatedSettings = await Promise.all(updatePromises);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message || 'Error updating settings' });
  }
});

// Create new setting (admin only)
router.post('/create', verifyToken, isAdmin, async (req, res) => {
  try {
    const { key, value, description, category, isPublic } = req.body;

    if (!key || value === undefined || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const setting = new Settings({
      key,
      value,
      description,
      category,
      isPublic: isPublic || false
    });

    await setting.save();
    res.status(201).json(setting);
  } catch (error) {
    console.error('Error creating setting:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Setting with this key already exists' });
    } else {
      res.status(500).json({ error: 'Error creating setting' });
    }
  }
});

// Delete setting (admin only)
router.delete('/:key', verifyToken, isAdmin, async (req, res) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Error deleting setting' });
  }
});

module.exports = router; 