const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const Objective = require('../models/Objective');
const Cycle = require('../models/Cycle');
const HRDecision = require('../models/HRDecision');
const auth = require('../middleware/auth');

// Get dashboard stats — supports scope=me|team|org
router.get('/dashboard', auth, async function (req, res) {
  try {
    var scope = req.query.scope || 'me';
    var userId = req.user.id;

    if (scope === 'me') {
      // Personal stats only
      var myObjectives = await Objective.countDocuments({ owner: userId, status: { $in: ['approved', 'validated'] } });
      var myTeam = await Team.findOne({ $or: [{ leader: userId }, { members: userId }] });
      res.json({
        users: 1,
        teams: myTeam ? 1 : 0,
        objectives: myObjectives,
        cycles: await Cycle.countDocuments({ status: 'active' })
      });
    } else if (scope === 'team') {
      // Team stats
      var team = await Team.findOne({ $or: [{ leader: userId }, { members: userId }] });
      if (!team) {
        return res.json({ users: 0, teams: 0, objectives: 0, cycles: 0 });
      }
      var teamMembers = [team.leader, ...team.members].filter(Boolean);
      var teamObjectives = await Objective.countDocuments({ owner: { $in: teamMembers }, status: { $in: ['approved', 'validated'] } });
      res.json({
        users: teamMembers.length,
        teams: 1,
        objectives: teamObjectives,
        cycles: await Cycle.countDocuments({ status: 'active' })
      });
    } else {
      // Org-wide stats
      var [usersCount, teamsCount, objectivesCount, cyclesCount] = await Promise.all([
        User.countDocuments(),
        Team.countDocuments(),
        Objective.countDocuments({ status: { $in: ['approved', 'validated'] } }),
        Cycle.countDocuments()
      ]);
      res.json({
        users: usersCount,
        teams: teamsCount,
        objectives: objectivesCount,
        cycles: cyclesCount
      });
    }
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get objectives by status (for pie chart)
router.get('/objectives-by-status', auth, async function (req, res) {
  try {
    var stats = await Objective.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    var result = {
      draft: 0,
      active: 0,
      submitted: 0,
      validated: 0,
      rejected: 0,
      completed: 0
    };

    stats.forEach(function (s) {
      if (s._id) {
        result[s._id] = s.count;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Get objectives by status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get HR decisions by action (for bar chart)
router.get('/decisions-by-action', auth, async function (req, res) {
  try {
    var stats = await HRDecision.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    var result = {
      reward: 0,
      promotion: 0,
      bonus: 0,
      satisfactory: 0,
      coaching: 0,
      training: 0,
      position_change: 0,
      termination_review: 0
    };

    stats.forEach(function (s) {
      if (s._id) {
        result[s._id] = s.count;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Get decisions by action error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get score distribution (for histogram)
router.get('/score-distribution', auth, async function (req, res) {
  try {
    var decisions = await HRDecision.find().select('finalScore');

    var ranges = {
      '0-59 (Red Flag)': 0,
      '60-69': 0,
      '70-79': 0,
      '80-89': 0,
      '90-100': 0
    };

    decisions.forEach(function (d) {
      var score = d.finalScore;
      if (score < 60) ranges['0-59 (Red Flag)']++;
      else if (score < 70) ranges['60-69']++;
      else if (score < 80) ranges['70-79']++;
      else if (score < 90) ranges['80-89']++;
      else ranges['90-100']++;
    });

    res.json(ranges);
  } catch (err) {
    console.error('Get score distribution error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get executive performance overview
router.get('/performance', auth, async function (req, res) {
  try {
    const cycleId = req.query.cycleId; // Optional: filter by specific cycle
    const query = cycleId ? { cycle: cycleId } : {};

    // Use MongoDB aggregation for optimal performance
    const stats = await HRDecision.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          companyAverage: { $avg: '$finalScore' },
          totalEvaluations: { $sum: 1 },
          redFlagsCount: {
            $sum: { $cond: [{ $lt: ['$finalScore', 60] }, 1, 0] }
          }
        }
      }
    ]);

    const topPerformers = await HRDecision.find(query)
      .sort({ finalScore: -1 })
      .limit(5)
      .populate('user', 'name role email');

    const bottomPerformers = await HRDecision.find(query)
      .sort({ finalScore: 1 })
      .limit(5)
      .populate('user', 'name role email');

    const redFlags = await HRDecision.find({ ...query, finalScore: { $lt: 60 } })
      .populate('user', 'name email');

    res.json({
      overview: stats[0] || { companyAverage: 0, totalEvaluations: 0, redFlagsCount: 0 },
      topPerformers,
      bottomPerformers,
      redFlags
    });
  } catch (err) {
    console.error('Get performance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users by role (for pie chart)
router.get('/users-by-role', auth, async function (req, res) {
  try {
    var stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    var result = {
      ADMIN: 0,
      HR: 0,
      TEAM_LEADER: 0,
      COLLABORATOR: 0
    };

    stats.forEach(function (s) {
      if (s._id) {
        result[s._id] = s.count;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Get users by role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity — supports scope=me|team|org
router.get('/recent-activity', auth, async function (req, res) {
  try {
    var scope = req.query.scope || 'me';
    var userId = req.user.id;
    var objFilter = {};
    var decFilter = {};

    if (scope === 'me') {
      objFilter.owner = userId;
      decFilter.user = userId;
    } else if (scope === 'team') {
      var team = await Team.findOne({ $or: [{ leader: userId }, { members: userId }] });
      if (team) {
        var teamMembers = [team.leader, ...team.members].filter(Boolean);
        objFilter.owner = { $in: teamMembers };
        decFilter.user = { $in: teamMembers };
      }
    }
    // scope=org: no filter (show all)

    var recentObjectives = await Objective.find(objFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('owner', 'name')
      .select('title status updatedAt owner goalStatus achievementPercent');

    var recentDecisions = await HRDecision.find(decFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .select('action finalScore createdAt user');

    res.json({
      objectives: recentObjectives,
      decisions: recentDecisions
    });
  } catch (err) {
    console.error('Get recent activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;