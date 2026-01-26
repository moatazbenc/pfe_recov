const mongoose = require('mongoose');

const evaluationCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['mid-year', 'end-year'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    submissionStart: {
      type: Date,
      required: true,
    },
    submissionEnd: {
      type: Date,
      required: true,
    },
    reviewDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'completed'],
      default: 'draft',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EvaluationCycle', evaluationCycleSchema);