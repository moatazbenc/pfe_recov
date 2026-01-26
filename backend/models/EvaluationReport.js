const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const evaluationReportSchema = new mongoose.Schema(
  {
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvaluationCycle',
      required: true,
    },
    collaborator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    objective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Objective',
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },
    submittedAt: Date,
    managerScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    managerFeedback: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'revision-requested'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

evaluationReportSchema.index(
  { cycle: 1, collaborator: 1, objective: 1 },
  { unique: true }
);

module.exports = mongoose.model('EvaluationReport', evaluationReportSchema);