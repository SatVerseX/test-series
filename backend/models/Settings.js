const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'test', 'user', 'notification', 'security']
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes - remove the duplicate key index
settingsSchema.index({ category: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 