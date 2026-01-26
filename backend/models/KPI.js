// KPI model for HR system
// Each KPI is linked to a user and a period (e.g., month, quarter, year)
// Enforces: value >= 0, type is enum, period is required

const mongoose = require('mongoose');

const KPI_TYPES = [
  'efficiency',
  'quality',
  'attendance',
  'initiative',
  'teamwork'
];

const kpiSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: KPI_TYPES,
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'KPI value cannot be negative']
  },
  period: {
    type: String,
    required: true,
    trim: true // e.g., '2025-Q1', '2025-01', '2025'
  }
}, {
  timestamps: true
});

// Prevent duplicate KPIs for the same user/type/period
kpiSchema.pre('save', async function(next) {
  const KPI = mongoose.model('KPI');
  const exists = await KPI.findOne({
    user: this.user,
    type: this.type,
    period: this.period,
    _id: { $ne: this._id }
  });
  if (exists) {
    return next(new Error('KPI for this user, type, and period already exists.'));
  }
  next();
});

module.exports = mongoose.model('KPI', kpiSchema);
