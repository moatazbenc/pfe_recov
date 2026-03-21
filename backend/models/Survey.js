const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['rating', 'text', 'multiple_choice', 'yes_no', 'scale'],
    default: 'text'
  },
  options: [{ type: String }],
  required: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

const ResponseSchema = new mongoose.Schema({
  respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  answers: [{
    questionIndex: { type: Number, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  }],
  submittedAt: { type: Date, default: Date.now },
});

const SurveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  questions: [QuestionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  anonymous: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['survey', 'pulse', 'engagement', 'exit', 'onboarding'],
    default: 'survey'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'team', 'department', 'specific'],
    default: 'all'
  },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  targetTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  responses: [ResponseSchema],
  deadline: { type: Date, default: null },
  aiSummary: { type: String, default: '' },
}, { timestamps: true });

SurveySchema.index({ status: 1, createdAt: -1 });
SurveySchema.index({ createdBy: 1 });

module.exports = mongoose.model('Survey', SurveySchema);
