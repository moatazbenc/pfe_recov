const mongoose = require('mongoose');

const CycleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Mid-Year', 'End-Year'],
    required: true
  },
  quarter: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  evaluationStart: {
    type: Date,
    required: true
  },
  evaluationEnd: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CycleSchema.index({ year: 1, quarter: 1 });

CycleSchema.pre('save', function (next) {
  var evalStart = new Date(this.evaluationStart);
  var evalEnd = new Date(this.evaluationEnd);
  evalStart.setHours(0, 0, 0, 0);
  evalEnd.setHours(23, 59, 59, 999);

  if (evalEnd < evalStart) {
    return next(new Error('Evaluation end date cannot be before start date'));
  }

  next();
});

module.exports = mongoose.model('Cycle', CycleSchema);