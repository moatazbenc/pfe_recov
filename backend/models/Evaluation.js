// Evaluation model for HR system
// Each evaluation is linked to an objective and a cycle (mid-year/end-year)
// Enforces: score <= objective value, finalScore auto-calculated, immutable once finalized

const mongoose = require('mongoose');

const CYCLES = ['mid-year', 'end-year'];
const STATUS = ['in-progress', 'finalized'];

const evaluationSchema = new mongoose.Schema({
  objective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective',
    required: true
  },
  cycle: {
    type: String,
    enum: CYCLES,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be negative']
  },
  finalScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: STATUS,
    default: 'in-progress',
    required: true
  },
  finalizedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate finalScore and enforce business rules
// finalScore = (score / objective.value) * objective.value (weighted)
evaluationSchema.pre('validate', async function(next) {
  const Objective = mongoose.model('Objective');
  const obj = await Objective.findById(this.objective);
  if (!obj) return next(new Error('Objective not found'));
  if (this.score > obj.value) {
    return next(new Error('Score cannot exceed objective value'));
  }
  // Weighted score calculation (can be adjusted as needed)
  this.finalScore = (this.score / obj.value) * obj.value;
  next();
});

// Prevent updates if status is finalized
// Data is immutable once finalized
// Only allow status change to finalized, not back
// finalizedAt is set when finalized

evaluationSchema.pre('save', function(next) {
  if (!this.isModified('status')) return next();
  if (this.status === 'finalized') {
    this.finalizedAt = new Date();
  } else if (this.isModified('status') && this.get('status', null, { getters: false }) === 'finalized') {
    return next(new Error('Cannot revert a finalized evaluation.'));
  }
  next();
});

evaluationSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.status === 'finalized') {
    update.finalizedAt = new Date();
  }
  // Prevent any update if already finalized
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.status === 'finalized') {
    return next(new Error('Cannot modify a finalized evaluation.'));
  }
  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
