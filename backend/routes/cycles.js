const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle');
const Objective = require('../models/Objective');
const HRDecision = require('../models/HRDecision');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimiter = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

var VALID_TYPES = ['Mid-Year', 'End-Year'];

function compareDates(date1, date2) {
  var d1 = new Date(date1);
  var d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() - d2.getTime();
}

// Get all cycles (All authenticated users can see cycles to bind objectives)
router.get('/', rateLimiter, auth, async function (req, res) {
  try {
    var cycles = await Cycle.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(cycles);
  } catch (err) {
    console.error('Get cycles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single cycle (All authenticated users)
router.get('/:id', rateLimiter, auth, async function (req, res) {
  try {
    var cycle = await Cycle.findById(req.params.id)
      .populate('createdBy', 'name email');
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    res.json(cycle);
  } catch (err) {
    console.error('Get cycle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create cycle (admin only)
router.post('/', rateLimiter, auth, role('ADMIN'), validate(schemas.cycle.create), async function (req, res) {
  try {
    var { name, year, type, evaluationStart, evaluationEnd, status } = req.body;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Type must be "Mid-Year" or "End-Year"' });
    }
    if (compareDates(evaluationEnd, evaluationStart) < 0) {
      return res.status(400).json({ message: 'Evaluation end date cannot be before start date' });
    }
    var cycle = new Cycle({
      name: name,
      year: year,
      type: type,
      status: status || 'draft',
      evaluationStart: evaluationStart,
      evaluationEnd: evaluationEnd,
      createdBy: req.user.id
    });
    await cycle.save();
    var populated = await Cycle.findById(cycle._id)
      .populate('createdBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create cycle error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Update cycle (admin only)
router.put('/:id', rateLimiter, auth, role('ADMIN'), validate(schemas.cycle.update), async function (req, res) {
  try {
    var { name, year, type, evaluationStart, evaluationEnd, status } = req.body;
    var cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    // Business Logic: fully locked if closed
    if (cycle.status === 'closed') {
      return res.status(400).json({ message: 'Cannot edit a closed cycle' });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Type must be "Mid-Year" or "End-Year"' });
    }
    var evalStart = evaluationStart || cycle.evaluationStart;
    var evalEnd = evaluationEnd || cycle.evaluationEnd;
    if (compareDates(evalEnd, evalStart) < 0) {
      return res.status(400).json({ message: 'Evaluation end date cannot be before start date' });
    }
    if (name) cycle.name = name;
    if (year) cycle.year = year;
    if (type) cycle.type = type;

    // Check if transitioning to closed
    if (status === 'closed' && cycle.status !== 'closed') {
      const objectives = await Objective.find({ cycle: cycle._id, status: 'validated' });

      const userScores = {};
      objectives.forEach(o => {
        const ownerId = String(o.owner);
        if (!userScores[ownerId]) userScores[ownerId] = { individual: 0, team: 0 };
        if (o.category === 'individual') userScores[ownerId].individual += (o.weightedScore || 0);
        if (o.category === 'team') userScores[ownerId].team += (o.weightedScore || 0);
      });

      const decisions = [];
      for (const [userId, scores] of Object.entries(userScores)) {
        const indScore = Math.min(scores.individual, 100) * 0.70;
        const teamScore = Math.min(scores.team, 100) * 0.30;
        const finalScore = Number((indScore + teamScore).toFixed(2));

        let action = 'satisfactory';
        if (finalScore >= 90) action = 'reward';
        else if (finalScore < 60) action = 'termination_review';

        decisions.push({
          user: userId,
          cycle: cycle._id,
          individualScore: Number(Math.min(scores.individual, 100).toFixed(2)),
          teamScore: Number(Math.min(scores.team, 100).toFixed(2)),
          finalScore,
          action
        });
      }

      if (decisions.length > 0) {
        await HRDecision.deleteMany({ cycle: cycle._id });
        await HRDecision.insertMany(decisions);
      }
    }

    if (status) cycle.status = status;
    if (evaluationStart) cycle.evaluationStart = evaluationStart;
    if (evaluationEnd) cycle.evaluationEnd = evaluationEnd;

    await cycle.save();
    var populated = await Cycle.findById(cycle._id)
      .populate('createdBy', 'name email');
    res.json(populated);
  } catch (err) {
    console.error('Update cycle error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Delete cycle (admin only)
router.delete('/:id', rateLimiter, auth, role('ADMIN'), async function (req, res) {
  try {
    var cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Business Logic constraint: Active or Closed cycles can never be deleted
    // "when the evaluation peridoe start u cant delete it"
    if (cycle.status !== 'draft') {
      return res.status(403).json({ message: 'LOCKED: You cannot delete a cycle once its evaluation period has started (Active) or Closed.' });
    }

    // Phase 7: Data Integrity - Cascade delete associated objectives and decisions
    const Objective = require('../models/Objective');
    const HRDecision = require('../models/HRDecision');

    await Objective.deleteMany({ cycle: cycle._id });
    await HRDecision.deleteMany({ cycle: cycle._id });

    await Cycle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cycle and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete cycle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;