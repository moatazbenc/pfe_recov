// backend/models/Objective.js
const mongoose = require('mongoose');

const STATUS = ['draft', 'submitted', 'validated'];

const objectiveSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // rule: >10 and <40 => 11..39
    value: {
      type: Number,
      required: true,
      min: [11, 'Objective value must be > 10'],
      max: [39, 'Objective value must be < 40'],
    },

    status: {
      type: String,
      enum: STATUS,
      default: 'draft',
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Objective', objectiveSchema);