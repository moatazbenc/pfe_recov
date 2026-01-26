// HRDecision controller: CRUD for HR decisions
// Enforces: Only HR can create/update, all business rules

const HRDecision = require('../models/HRDecision');
const User = require('../models/User');

// Create HR decision (HR only)
exports.createHRDecision = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can create HR decisions.' });
    }
    const { user, decisionType, reason, date } = req.body;
    if (!user || !decisionType || !reason || !date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    // Ensure user exists
    const target = await User.findById(user);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    const decision = await HRDecision.create({
      user,
      decisionType,
      reason,
      date,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, decision });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all HR decisions (HR only)
exports.getHRDecisions = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can view HR decisions.' });
    }
    const decisions = await HRDecision.find().populate('user', 'name email role');
    res.json({ success: true, decisions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get HR decision by ID (HR only)
exports.getHRDecisionById = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can view HR decisions.' });
    }
    const decision = await HRDecision.findById(req.params.id).populate('user', 'name email role');
    if (!decision) return res.status(404).json({ success: false, message: 'HR decision not found.' });
    res.json({ success: true, decision });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update HR decision (HR only)
exports.updateHRDecision = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can update HR decisions.' });
    }
    const { decisionType, reason, date } = req.body;
    const decision = await HRDecision.findById(req.params.id);
    if (!decision) return res.status(404).json({ success: false, message: 'HR decision not found.' });
    if (decisionType) decision.decisionType = decisionType;
    if (reason) decision.reason = reason;
    if (date) decision.date = date;
    await decision.save();
    res.json({ success: true, decision });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete HR decision (HR only)
exports.deleteHRDecision = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can delete HR decisions.' });
    }
    const decision = await HRDecision.findByIdAndDelete(req.params.id);
    if (!decision) return res.status(404).json({ success: false, message: 'HR decision not found.' });
    res.json({ success: true, message: 'HR decision deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
