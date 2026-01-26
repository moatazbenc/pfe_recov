// HRDecision model for HR system
// Each decision is linked to a user and made by HR
// Enforces: Only HR can create/update, decisionType is enum, date is required

const mongoose = require('mongoose');

const DECISION_TYPES = [
  'bonus',
  'training',
  'promotion',
  'mobility',
  'termination'
];

const hrDecisionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  decisionType: {
    type: String,
    enum: DECISION_TYPES,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Must be HR
    required: true
  }
}, {
  timestamps: true
});

// Enforce only HR can create/update decisions
hrDecisionSchema.pre('validate', async function(next) {
  const User = mongoose.model('User');
  const creator = await User.findById(this.createdBy);
  if (!creator || creator.role !== 'HR') {
    return next(new Error('Only HR can create or update HR decisions.'));
  }
  next();
});

module.exports = mongoose.model('HRDecision', hrDecisionSchema);
