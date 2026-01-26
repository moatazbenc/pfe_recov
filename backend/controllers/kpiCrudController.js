// KPI CRUD controller for HR system
// Handles creation, update, deletion, and retrieval of KPIs
// Enforces business rules: no duplicate KPIs for user/type/period

const KPI = require('../models/KPI');
const User = require('../models/User');

// Create KPI (HR only)
exports.createKPI = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can create KPIs.' });
    }
    const { user, type, value, period } = req.body;
    if (!user || !type || value === undefined || !period) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    // Ensure user exists
    const target = await User.findById(user);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    // Prevent duplicate
    const exists = await KPI.findOne({ user, type, period });
    if (exists) {
      return res.status(409).json({ success: false, message: 'KPI for this user, type, and period already exists.' });
    }
    const kpi = await KPI.create({ user, type, value, period });
    res.status(201).json({ success: true, kpi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all KPIs (HR only)
exports.getKPIs = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can view KPIs.' });
    }
    const kpis = await KPI.find().populate('user', 'name email role');
    res.json({ success: true, kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get KPI by ID (HR only)
exports.getKPIById = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can view KPIs.' });
    }
    const kpi = await KPI.findById(req.params.id).populate('user', 'name email role');
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI not found.' });
    res.json({ success: true, kpi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update KPI (HR only)
exports.updateKPI = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can update KPIs.' });
    }
    const { type, value, period } = req.body;
    const kpi = await KPI.findById(req.params.id);
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI not found.' });
    // Prevent duplicate
    const exists = await KPI.findOne({ user: kpi.user, type, period, _id: { $ne: kpi._id } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'KPI for this user, type, and period already exists.' });
    }
    kpi.type = type;
    kpi.value = value;
    kpi.period = period;
    await kpi.save();
    res.json({ success: true, kpi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete KPI (HR only)
exports.deleteKPI = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, message: 'Only HR can delete KPIs.' });
    }
    const kpi = await KPI.findByIdAndDelete(req.params.id);
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI not found.' });
    res.json({ success: true, message: 'KPI deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
