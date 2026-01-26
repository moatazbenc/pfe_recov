// Evaluation controller: CRUD and business rules
// Enforces: score <= objective value, finalScore auto, immutability after finalized, cycle enforcement

const Evaluation = require('../models/Evaluation');
const Objective = require('../models/Objective');
const Team = require('../models/Team');

// Create evaluation (Manager only, for validated objectives, per cycle)
exports.createEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ success: false, message: 'Only managers can create evaluations.' });
    }
    const { objective, score, cycle } = req.body;
    if (!objective || score === undefined || !cycle) {
      return res.status(400).json({ success: false, message: 'Objective, score, and cycle are required.' });
    }
    // Ensure objective exists and is validated
    const obj = await Objective.findById(objective);
    if (!obj || obj.status !== 'validated') {
      return res.status(400).json({ success: false, message: 'Objective must exist and be validated.' });
    }
    // Ensure manager manages the owner
    const team = await Team.findOne({ manager: req.user._id });
    if (!team || !team.collaborators.some(c => c.equals(obj.owner))) {
      return res.status(403).json({ success: false, message: 'Manager can only evaluate their own team.' });
    }
    // Ensure only one evaluation per objective per cycle
    const existing = await Evaluation.findOne({ objective, cycle });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Evaluation for this objective and cycle already exists.' });
    }
    const evaluation = await Evaluation.create({ objective, score, cycle });
    res.status(201).json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get evaluations (role-based)
exports.getEvaluations = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'Collaborator') {
      // Find objectives owned by user
      const objectives = await Objective.find({ owner: req.user._id });
      filter.objective = { $in: objectives.map(o => o._id) };
    } else if (req.user.role === 'Manager') {
      // Find objectives for manager's team
      const team = await Team.findOne({ manager: req.user._id });
      if (!team) return res.json({ success: true, evaluations: [] });
      const objectives = await Objective.find({ owner: { $in: team.collaborators } });
      filter.objective = { $in: objectives.map(o => o._id) };
    }
    const evaluations = await Evaluation.find(filter)
      .populate({ path: 'objective', populate: { path: 'owner', select: 'name email' } });
    res.json({ success: true, evaluations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single evaluation (role-based)
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate({ path: 'objective', populate: { path: 'owner', select: 'name email' } });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found.' });
    // Only HR, manager of team, or owner can view
    const obj = evaluation.objective;
    if (
      req.user.role !== 'HR' &&
      !obj.owner._id.equals(req.user._id)
    ) {
      if (req.user.role === 'Manager') {
        const team = await Team.findOne({ manager: req.user._id });
        if (!team || !team.collaborators.some(c => c.equals(obj.owner._id))) {
          return res.status(403).json({ success: false, message: 'Forbidden.' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
    }
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Finalize evaluation (Manager only, in-progress → finalized, immutable)
exports.finalizeEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ success: false, message: 'Only managers can finalize evaluations.' });
    }
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found.' });
    // Ensure manager manages the owner
    const obj = await Objective.findById(evaluation.objective);
    const team = await Team.findOne({ manager: req.user._id });
    if (!team || !team.collaborators.some(c => c.equals(obj.owner))) {
      return res.status(403).json({ success: false, message: 'Manager can only finalize their own team.' });
    }
    if (evaluation.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Only in-progress evaluations can be finalized.' });
    }
    evaluation.status = 'finalized';
    await evaluation.save();
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
