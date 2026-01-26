// KPI Controller: Team performance, employee ranking, performance evolution
// Aggregates and returns statistics for HR dashboards

const Evaluation = require('../models/Evaluation');
const Team = require('../models/Team');
const Objective = require('../models/Objective');
const User = require('../models/User');

// Team performance average (per cycle)
exports.teamPerformance = async (req, res) => {
  try {
    const { teamId, cycle } = req.query;
    if (!teamId || !cycle) {
      return res.status(400).json({ success: false, message: 'teamId and cycle are required.' });
    }
    // Get all objectives for team collaborators
    const team = await Team.findById(teamId).populate('collaborators');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });
    const objectives = await Objective.find({ owner: { $in: team.collaborators.map(c => c._id) } });
    const evaluations = await Evaluation.find({ objective: { $in: objectives.map(o => o._id) }, cycle, status: 'finalized' });
    if (evaluations.length === 0) return res.json({ success: true, average: 0 });
    const avg = evaluations.reduce((acc, e) => acc + e.finalScore, 0) / evaluations.length;
    res.json({ success: true, average: avg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Employee ranking (by total score, per cycle)
exports.employeeRanking = async (req, res) => {
  try {
    const { cycle } = req.query;
    if (!cycle) {
      return res.status(400).json({ success: false, message: 'cycle is required.' });
    }
    // Aggregate total score per user
    const pipeline = [
      { $match: { status: 'finalized', cycle } },
      { $lookup: {
          from: 'objectives',
          localField: 'objective',
          foreignField: '_id',
          as: 'objectiveObj'
      }},
      { $unwind: '$objectiveObj' },
      { $group: {
          _id: '$objectiveObj.owner',
          totalScore: { $sum: '$finalScore' }
      }},
      { $sort: { totalScore: -1 } },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: '$user' },
      { $project: { _id: 0, user: { name: '$user.name', email: '$user.email' }, totalScore: 1 } }
    ];
    const ranking = await Evaluation.aggregate(pipeline);
    res.json({ success: true, ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Performance evolution (per user, all cycles)
exports.performanceEvolution = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required.' });
    }
    // Aggregate total score per cycle for user
    const pipeline = [
      { $lookup: {
          from: 'objectives',
          localField: 'objective',
          foreignField: '_id',
          as: 'objectiveObj'
      }},
      { $unwind: '$objectiveObj' },
      { $match: { 'objectiveObj.owner': require('mongoose').Types.ObjectId(userId), status: 'finalized' } },
      { $group: {
          _id: '$cycle',
          totalScore: { $sum: '$finalScore' }
      }},
      { $sort: { _id: 1 } }
    ];
    const evolution = await Evaluation.aggregate(pipeline);
    res.json({ success: true, evolution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
