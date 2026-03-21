const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimiter = require('../middleware/rateLimiter');

// Get all teams (admin, manager only)
router.get('/', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER'), async function (req, res) {
  try {
    var teams = await Team.find({})
      .populate('leader', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single team (admin, manager only)
router.get('/:id', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER'), async function (req, res) {
  try {
    var team = await Team.findById(req.params.id)
      .populate('leader', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create team (ADMIN, HR, TEAM_LEADER)
router.post('/', rateLimiter, auth, role('ADMIN', 'HR', 'TEAM_LEADER'), async function (req, res) {
  try {
    var { name, description, leader, members } = req.body;
    var team = new Team({
      name: name,
      description: description || '',
      leader: leader || null,
      members: members || [],
      createdBy: req.user.id
    });
    await team.save();
    if (leader) {
      await User.findByIdAndUpdate(leader, { team: team._id });
    }
    if (members && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { team: team._id }
      );
    }
    var populated = await Team.findById(team._id)
      .populate('leader', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team (ADMIN, HR, TEAM_LEADER)
router.put('/:id', rateLimiter, auth, role('ADMIN', 'HR', 'TEAM_LEADER'), async function (req, res) {
  try {
    var { name, description, leader, members } = req.body;
    var team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    await User.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (leader !== undefined) team.leader = leader || null;
    if (members !== undefined) team.members = members || [];
    await team.save();
    if (team.leader) {
      await User.findByIdAndUpdate(team.leader, { team: team._id });
    }
    if (team.members && team.members.length > 0) {
      await User.updateMany(
        { _id: { $in: team.members } },
        { team: team._id }
      );
    }
    var populated = await Team.findById(team._id)
      .populate('leader', 'name email role')
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
    res.json(populated);
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete team (admin only)
router.delete('/:id', rateLimiter, auth, role('ADMIN'), async function (req, res) {
  try {
    var team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    await User.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;