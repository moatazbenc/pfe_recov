// backend/controllers/objectiveController.js
const mongoose = require('mongoose');
const Objective = require('../models/Objective');
const User = require('../models/User');

const isSuper = (role) => role === 'Admin' || role === 'HR';
const isEmployee = (role) => role === 'Collaborator' || role === 'Employee';

async function resolveOwner(ownerInput) {
  if (!ownerInput) return null;

  // email
  if (typeof ownerInput === 'string' && ownerInput.includes('@')) {
    const u = await User.findOne({ email: ownerInput });
    return u ? u._id : null;
  }

  // ObjectId
  if (mongoose.Types.ObjectId.isValid(ownerInput)) {
    return ownerInput;
  }

  return null;
}

// CREATE
exports.createObjective = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    // Who can create?
    if (!superUser && !isEmployee(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, description, value } = req.body;

    if (!title || value === undefined) {
      return res.status(400).json({ success: false, message: 'Title and value are required.' });
    }

    // owner:
    // - employee: forced to himself
    // - super user: can set owner by email or id, else defaults to himself
    let ownerId = req.user.id;

    if (superUser && req.body.owner) {
      const resolved = await resolveOwner(req.body.owner);
      if (!resolved) {
        return res.status(400).json({ success: false, message: 'Invalid owner (use userId or email).' });
      }
      ownerId = resolved;
    }

    const objective = await Objective.create({
      title,
      description,
      value: Number(value),
      owner: ownerId,
      status: 'draft',
    });

    res.status(201).json({ success: true, objective });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// READ ALL
exports.getObjectives = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);
    let filter = {};

    if (!superUser) {
      if (isEmployee(req.user.role)) {
        filter.owner = req.user.id;
      } else if (req.user.role === 'Manager') {
        // If you have Team model:
        const Team = require('../models/Team');
        const team = await Team.findOne({ manager: req.user.id });
        if (!team) return res.json({ success: true, objectives: [] });

        filter.owner = { $in: team.collaborators };
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const objectives = await Objective.find(filter).populate('owner', 'name email role');
    res.json({ success: true, objectives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ ONE
exports.getObjectiveById = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    const objective = await Objective.findById(req.params.id).populate('owner', 'name email role');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    if (superUser) return res.json({ success: true, objective });

    // employee: only own
    if (isEmployee(req.user.role)) {
      if (String(objective.owner?._id || objective.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      return res.json({ success: true, objective });
    }

    // manager: must manage owner
    if (req.user.role === 'Manager') {
      const Team = require('../models/Team');
      const team = await Team.findOne({ manager: req.user.id });
      const ownerId = objective.owner?._id || objective.owner;
      if (!team || !team.collaborators.some((c) => String(c) === String(ownerId))) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      return res.json({ success: true, objective });
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE (your route uses PUT)
exports.updateObjective = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    // Restrict only if NOT super user
    if (!superUser) {
      if (String(objective.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Only the owner can update this objective.' });
      }
      if (objective.status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft objectives can be updated.' });
      }
    }

    const { title, description, value, status, owner } = req.body;

    if (title !== undefined) objective.title = title;
    if (description !== undefined) objective.description = description;
    if (value !== undefined) objective.value = Number(value);

    // allow super user to change status/owner if needed for testing
    if (superUser && status) objective.status = status;
    if (superUser && owner) {
      const resolved = await resolveOwner(owner);
      if (!resolved) return res.status(400).json({ success: false, message: 'Invalid owner (use userId or email).' });
      objective.owner = resolved;
    }

    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// SUBMIT (draft -> submitted)
exports.submitObjective = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    if (!superUser) {
      if (String(objective.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Only the owner can submit this objective.' });
      }
      if (objective.status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft objectives can be submitted.' });
      }
    }

    objective.status = 'submitted';
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// VALIDATE (submitted -> validated)
exports.validateObjective = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    if (!superUser) {
      if (req.user.role !== 'Manager') {
        return res.status(403).json({ success: false, message: 'Only managers can validate.' });
      }

      const Team = require('../models/Team');
      const team = await Team.findOne({ manager: req.user.id });
      if (!team || !team.collaborators.some((c) => String(c) === String(objective.owner))) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }

      if (objective.status !== 'submitted') {
        return res.status(400).json({ success: false, message: 'Only submitted objectives can be validated.' });
      }
    }

    objective.status = 'validated';
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteObjective = async (req, res) => {
  try {
    const superUser = isSuper(req.user.role);

    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    if (!superUser) {
      if (String(objective.owner) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Only the owner can delete this objective.' });
      }
      if (objective.status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft objectives can be deleted.' });
      }
    }

    await Objective.deleteOne({ _id: objective._id });
    res.json({ success: true, message: 'Objective deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};