const mongoose = require('mongoose');

const ReviewQuestionResponseSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: { type: String, enum: ['rating', 'text', 'multiple_choice', 'competency'], default: 'text' },
  answer: { type: mongoose.Schema.Types.Mixed, default: null },
  score: { type: Number, min: 0, max: 5, default: null },
  maxScore: { type: Number, default: 5 },
});

const ReviewSchema = new mongoose.Schema({
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycle: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', default: null },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewTemplate', default: null },
  type: {
    type: String,
    enum: ['self', 'manager', 'peer', '360', 'upward'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'acknowledged', 'completed'],
    default: 'pending'
  },
  responses: [ReviewQuestionResponseSchema],
  overallRating: { type: Number, min: 0, max: 5, default: null },
  overallComments: { type: String, default: '' },
  strengths: { type: String, default: '' },
  areasForImprovement: { type: String, default: '' },
  goals: { type: String, default: '' },
  privateNotes: { type: String, default: '' },
  submittedAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  aiSummary: { type: String, default: '' },
  visibility: {
    type: String,
    enum: ['private', 'reviewee', 'manager', 'hr', 'public'],
    default: 'private'
  },
}, { timestamps: true });

ReviewSchema.index({ reviewee: 1, cycle: 1 });
ReviewSchema.index({ reviewer: 1, status: 1 });
ReviewSchema.index({ type: 1, status: 1 });
ReviewSchema.index({ cycle: 1, status: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
