
const mongoose = require('mongoose');

const KpiSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  metricType: { type: String, enum: ['percent', 'number', 'currency', 'boolean', 'milestone'], default: 'percent' },
  initialValue: { type: Number, default: 0 },
  targetValue: { type: Number, default: 100 },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
}, { _id: true, timestamps: true });

const ProgressUpdateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
});

const ObjectiveSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  successIndicator: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cycle: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true, index: true },
  category: { type: String, enum: ['individual', 'team'], default: 'individual' },
  weight: { type: Number, required: true, min: 1, max: 100 },
  deadline: { type: Date, required: false },
  achievementPercent: { type: Number, min: 0, max: 100, default: null },
  selfAssessment: { type: String, default: '' },
  managerAdjustedPercent: { type: Number, min: 0, max: 100, default: null },
  managerComments: { type: String, default: '' },
  weightedScore: { type: Number, default: null },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'validated', 'locked'],
    default: 'draft',
    index: true
  },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  validatedAt: { type: Date, default: null },

  // === NEW GOAL FIELDS ===
  goalStatus: {
    type: String,
    enum: ['no_status', 'on_track', 'at_risk', 'off_track', 'closed', 'achieved'],
    default: 'no_status',
    index: true
  },
  startDate: { type: Date, default: null },
  labels: [{ type: String, trim: true }],
  visibility: {
    type: String,
    enum: ['private', 'team', 'department', 'public'],
    default: 'public'
  },
  parentObjective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective',
    default: null,
    index: true
  },
  kpis: [KpiSchema],
  progressUpdates: [ProgressUpdateSchema],
  comments: [CommentSchema],
  attachments: [AttachmentSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ObjectiveSchema.index({ owner: 1, cycle: 1, title: 1 }, { unique: true });
ObjectiveSchema.index({ owner: 1, status: 1 });

ObjectiveSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

ObjectiveSchema.index({ owner: 1, cycle: 1 });
ObjectiveSchema.index({ status: 1 });
ObjectiveSchema.index({ category: 1 });
ObjectiveSchema.index({ goalStatus: 1 });

module.exports = mongoose.model('Objective', ObjectiveSchema);