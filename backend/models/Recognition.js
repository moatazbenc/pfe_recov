const mongoose = require('mongoose');

const RecognitionSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true },
  badge: {
    type: String,
    enum: ['⭐', '🏆', '🚀', '💎', '🔥', '🎯', '💡', '🤝', '👏', '🌟'],
    default: '⭐'
  },
  badgeLabel: { type: String, default: 'Star' },
  points: { type: Number, default: 10, min: 1 },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['teamwork', 'innovation', 'leadership', 'customer_focus', 'excellence', 'other'],
    default: 'other'
  },
  relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

RecognitionSchema.index({ recipient: 1, createdAt: -1 });
RecognitionSchema.index({ sender: 1, createdAt: -1 });
RecognitionSchema.index({ visibility: 1, createdAt: -1 });

module.exports = mongoose.model('Recognition', RecognitionSchema);
