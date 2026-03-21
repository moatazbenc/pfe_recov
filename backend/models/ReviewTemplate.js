const mongoose = require('mongoose');

const TemplateQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['rating', 'text', 'multiple_choice', 'competency'],
    default: 'text'
  },
  options: [{ type: String }],
  required: { type: Boolean, default: true },
  maxScore: { type: Number, default: 5 },
  category: { type: String, default: 'general' },
  order: { type: Number, default: 0 },
});

const ReviewTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  questions: [TemplateQuestionSchema],
  type: {
    type: String,
    enum: ['self', 'manager', 'peer', '360', 'upward', 'general'],
    default: 'general'
  },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ReviewTemplateSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('ReviewTemplate', ReviewTemplateSchema);
