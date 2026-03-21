const Objective = require('../models/Objective');
const User = require('../models/User');
const Team = require('../models/Team');
const Cycle = require('../models/Cycle');
const { createNotification } = require('./notificationController');

// Create objective (COLLABORATOR only, own objectives)
exports.createObjective = async (req, res) => {
  try {
    const { title, description, successIndicator, weight, deadline, cycle, category, labels, visibility, startDate, parentObjective, goalStatus, targetUser, targetTeam } = req.body;

    if (!cycle) return res.status(400).json({ success: false, message: 'Cycle is required.' });

    const targetedCycle = await Cycle.findById(cycle);
    if (!targetedCycle) return res.status(404).json({ success: false, message: 'Cycle not found.' });
    if (targetedCycle.status === 'closed') return res.status(400).json({ success: false, message: 'Cannot add objectives to a closed cycle.' });

    if (!title || !weight) {
      return res.status(400).json({ success: false, message: 'Title and weight are required.' });
    }
    if (weight < 1 || weight > 100) {
      return res.status(400).json({ success: false, message: 'Weight must be between 1 and 100.' });
    }
    let ownerId = req.user.id;
    if (category === 'individual' && targetUser && (req.user.role === 'TEAM_LEADER' || req.user.role === 'ADMIN' || req.user.role === 'HR')) {
      ownerId = targetUser;
    }

    const exists = await Objective.findOne({ owner: ownerId, cycle, title });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Duplicate objective title within this cycle.' });
    }

    const count = await Objective.countDocuments({ owner: ownerId, cycle });
    if (count >= 10) {
      return res.status(400).json({ success: false, message: 'Maximum objectives reached for this cycle.' });
    }

    // Validate total weight doesn't exceed 100 for this category
    const existingObjs = await Objective.find({ owner: ownerId, cycle, category: category || 'individual' });
    const usedWeight = existingObjs.reduce(function(sum, o) { return sum + (o.weight || 0); }, 0);
    if (usedWeight + weight > 100) {
      return res.status(400).json({ success: false, message: 'Total weight would exceed 100%. Currently used: ' + usedWeight + '%, trying to add: ' + weight + '%.' });
    }

    if (category === 'team') {
      if (req.user.role !== 'TEAM_LEADER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Team Leaders or Admins can create inherited Team Objectives' });
      }

      let team;
      if (targetTeam) {
        team = await Team.findById(targetTeam).populate('members', '_id name');
      } else {
        team = await Team.findOne({ leader: req.user.id }).populate('members', '_id name');
        if (!team) {
          team = await Team.findOne({ leader: req.user._id }).populate('members', '_id name');
        }
      }

      if (!team) {
        return res.status(400).json({ success: false, message: 'You are not assigned as a leader of any team or team not found. Please contact HR.' });
      }

      if (!team.members || team.members.length === 0) {
        return res.status(400).json({ success: false, message: 'Your team has no members. Add members to your team before creating team objectives.' });
      }

      // Create the objective for each team member
      const memberObjectives = team.members.map(member => ({
        owner: member._id,
        cycle,
        category: 'team',
        title,
        description,
        successIndicator: successIndicator || title,
        weight,
        deadline,
        status: 'draft',
        labels: labels || [],
        visibility: visibility || 'public',
        startDate: startDate || null,
        goalStatus: goalStatus || 'no_status',
        parentObjective: parentObjective || null,
      }));

      await Objective.insertMany(memberObjectives);
      res.status(201).json({ success: true, message: `Team Objective successfully distributed to ${team.members.length} team member(s): ${team.members.map(m => m.name).join(', ')}` });
    } else {
      const objective = await Objective.create({
        owner: ownerId, // Use ownerId determined earlier
        cycle,
        category: 'individual',
        title,
        description,
        successIndicator,
        weight,
        deadline,
        status: 'draft',
        labels: labels || [],
        visibility: visibility || 'public',
        startDate: startDate || null,
        parentObjective: parentObjective || null,
        goalStatus: goalStatus || 'no_status',
      });
      res.status(201).json({ success: true, objective });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all objectives (role-based)
exports.getObjectives = async (req, res) => {
  try {
    let filter = {};
    if (req.query.cycle) {
      filter.cycle = req.query.cycle;
    }
    if (req.query.goalStatus && req.query.goalStatus !== 'all') {
      filter.goalStatus = req.query.goalStatus;
    }
    if (req.query.label) {
      filter.labels = req.query.label;
    }

    const targetUserId = req.query.targetUserId;
    if (targetUserId) {
      filter.owner = targetUserId;
    } else {
      if (req.user.role === 'TEAM_LEADER') {
        if (req.query.scope === 'my') {
          filter.owner = req.user.id;
        } else {
          const team = await Team.findOne({ leader: req.user.id });
          if (!team) return res.json({ success: true, objectives: [] });
          filter.owner = { $in: [req.user.id, ...team.members] };
        }
      } else if (req.user.role === 'COLLABORATOR') {
        filter.owner = req.user.id;
      }
    }

    const objectives = await Objective.find(filter)
      .populate('owner', 'name email role')
      .populate('cycle', 'name year status')
      .populate('parentObjective', 'title')
      .sort({ createdAt: -1 });

    if (targetUserId && req.query.cycle) {
      const individualObjectives = objectives.filter(o => o.category === 'individual');
      const teamObjectives = objectives.filter(o => o.category === 'team');

      let indScoreSum = 0; let teamScoreSum = 0;
      individualObjectives.forEach(o => { indScoreSum += (o.weightedScore || 0); });
      teamObjectives.forEach(o => { teamScoreSum += (o.weightedScore || 0); });

      const indScoreRaw = Math.min(indScoreSum, 100);
      const teamScoreRaw = Math.min(teamScoreSum, 100);
      const individualScore = Number((indScoreRaw * 0.70).toFixed(2));
      const teamScore = Number((teamScoreRaw * 0.30).toFixed(2));
      const compositeScore = Number((individualScore + teamScore).toFixed(2));

      const indWeight = individualObjectives.reduce((s, o) => s + o.weight, 0);
      const tmWeight = teamObjectives.reduce((s, o) => s + o.weight, 0);

      const validation = {
        individualCount: individualObjectives.length,
        minIndividualObjectives: 3,
        isValidIndividualCount: individualObjectives.length >= 3,
        individualWeight: indWeight,
        isValidIndividualWeight: indWeight === 100,
        individualValidatedCount: individualObjectives.filter(o => o.status === 'validated').length,
        individualRejectedCount: individualObjectives.filter(o => o.status === 'rejected').length,
        individualScore: indScoreRaw,
        individualRemainingWeight: Math.max(0, 100 - indWeight),
        canAddMoreIndividual: individualObjectives.length < 7 && indWeight < 100,
        teamCount: teamObjectives.length,
        teamWeight: tmWeight,
        isValidTeamWeight: tmWeight === 100,
        teamValidatedCount: teamObjectives.filter(o => o.status === 'validated').length,
        teamScore: teamScoreRaw,
        teamRemainingWeight: Math.max(0, 100 - tmWeight),
        canAddMoreTeam: teamObjectives.length < 7 && tmWeight < 100,
        requiredCategoryTotal: 100,
        compositeScore,
        totalRejected: individualObjectives.filter(o => o.status === 'rejected').length + teamObjectives.filter(o => o.status === 'rejected').length,
        allValidated: objectives.length > 0 && objectives.every(o => o.status === 'validated')
      };

      return res.json({ success: true, individualObjectives, teamObjectives, validation });
    }

    res.json({ success: true, objectives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single objective (role-based)
exports.getObjectiveById = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('cycle', 'name year status')
      .populate('parentObjective', 'title')
      .populate('comments.user', 'name email')
      .populate('progressUpdates.user', 'name email');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    if (req.user.role === 'ADMIN' || req.user.role === 'HR') return res.json({ success: true, objective });
    if (req.user.role === 'COLLABORATOR' && String(objective.owner._id) === String(req.user.id)) return res.json({ success: true, objective });
    if (req.user.role === 'TEAM_LEADER') {
      const team = await Team.findOne({ leader: req.user.id });
      if (team && (String(req.user.id) === String(objective.owner._id) || team.members.some((c) => String(c) === String(objective.owner._id)))) {
        return res.json({ success: true, objective });
      }
    }
    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get pending validation objectives for Team Leader
exports.getPendingValidation = async (req, res) => {
  try {
    if (req.user.role !== 'TEAM_LEADER') {
      return res.status(403).json({ success: false, message: 'Only Team Leaders can fetch pending validations.' });
    }
    const team = await Team.findOne({ leader: req.user.id });
    if (!team || !team.members || team.members.length === 0) {
      return res.json([]);
    }
    const unvalidatedObjectives = await Objective.find({
      owner: { $in: team.members },
      status: 'submitted'
    }).populate('owner', 'name email').populate('cycle', 'name year status');
    res.json(unvalidatedObjectives);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update objective
exports.updateObjective = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id).populate('cycle');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });

    const isOwner = String(objective.owner) === String(req.user.id);
    const isAdmin = req.user.role === 'ADMIN';
    const isLeader = req.user.role === 'TEAM_LEADER';

    if (!isOwner && !isAdmin && !isLeader) {
      return res.status(403).json({ success: false, message: 'Not authorized to update.' });
    }
    if (objective.cycle && objective.cycle.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot edit objects in a closed cycle.' });
    }
    if (req.user.role === 'COLLABORATOR' && objective.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft objectives can be updated structurally.' });
    }

    const { title, description, weight, deadline, labels, visibility, startDate, goalStatus, parentObjective } = req.body;
    if (title !== undefined) objective.title = title;
    if (description !== undefined) objective.description = description;
    if (weight !== undefined) objective.weight = weight;
    if (deadline !== undefined) objective.deadline = deadline;
    if (labels !== undefined) objective.labels = labels;
    if (visibility !== undefined) objective.visibility = visibility;
    if (startDate !== undefined) objective.startDate = startDate;
    if (goalStatus !== undefined) objective.goalStatus = goalStatus;
    if (parentObjective !== undefined) objective.parentObjective = parentObjective;

    // Validate total weight if weight changed
    if (weight !== undefined) {
      const siblings = await Objective.find({
        owner: objective.owner,
        cycle: objective.cycle,
        category: objective.category || 'individual',
        _id: { $ne: objective._id }
      });
      const totalWeight = siblings.reduce(function(sum, o) { return sum + (o.weight || 0); }, 0) + parseInt(weight);
      if (totalWeight > 100) {
        return res.status(400).json({ success: false, message: 'Total weight would exceed 100%. Other goals use ' + (totalWeight - parseInt(weight)) + '%, max you can set: ' + (100 - (totalWeight - parseInt(weight))) + '%.' });
      }
    }

    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit objectives (COLLABORATOR only)
exports.submitObjectives = async (req, res) => {
  try {
    const { cycle } = req.body;
    if (!cycle) return res.status(400).json({ success: false, message: 'Cycle is required to submit objectives.' });
    const targetedCycle = await Cycle.findById(cycle);
    if (!targetedCycle || targetedCycle.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cycle is invalid or closed.' });
    }
    const objectives = await Objective.find({ owner: req.user.id, cycle, category: 'individual' });
    if (objectives.length < 3 || objectives.length > 10) {
      return res.status(400).json({ success: false, message: 'You must have between 3 and 10 individual objectives to submit.' });
    }
    
    const totalWeight = objectives.reduce((sum, obj) => sum + (obj.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ success: false, message: `Total weight of individual objectives must equal exactly 100. Current total: ${totalWeight}` });
    }

    await Objective.updateMany({ owner: req.user.id, cycle }, { status: 'submitted' });
    
    const user = await User.findById(req.user.id);
    const team = await Team.findOne({ members: req.user.id });
    if (team && team.leader) {
      await createNotification(team.leader, 'Objectives Submitted', `${user ? user.name : 'A team member'} submitted their objectives for validation.`, `/evaluations`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit individual objective progress (COLLABORATOR only)
exports.submitProgress = async (req, res) => {
  try {
    const { achievementPercent, selfAssessment } = req.body;
    const objective = await Objective.findById(req.params.id).populate('cycle');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    if (String(objective.owner) !== String(req.user.id) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the owner can submit progress.' });
    }
    if (objective.cycle && objective.cycle.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cycle is closed.' });
    }
    objective.achievementPercent = achievementPercent;
    objective.selfAssessment = selfAssessment;
    objective.weightedScore = (objective.weight * achievementPercent) / 100;
    await objective.save();

    if (achievementPercent >= 100) {
      const team = await Team.findOne({ members: objective.owner });
      if (team && team.leader) {
        const user = await User.findById(objective.owner);
        await createNotification(team.leader, 'Objective Completed', `${user ? user.name : 'A team member'} reached 100% on "${objective.title}".`, `/evaluations`);
      }
    }

    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Validate objective (TEAM_LEADER only)
exports.validateObjective = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id).populate('cycle');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    if (req.user.role !== 'TEAM_LEADER') {
      return res.status(403).json({ success: false, message: 'Only team leaders can validate.' });
    }
    if (objective.cycle && objective.cycle.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cycle is closed.' });
    }
    const team = await Team.findOne({ leader: req.user.id });
    if (!team || !team.members.some((c) => String(c) === String(objective.owner))) {
      return res.status(403).json({ success: false, message: 'Forbidden: User not in your team.' });
    }
    if (objective.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted objectives can be validated.' });
    }
    const { status, managerAdjustedPercent, managerComments } = req.body;
    if (status && ['validated', 'rejected'].includes(status)) {
      objective.status = status;
    } else {
      objective.status = 'validated';
    }
    if (managerAdjustedPercent !== undefined && managerAdjustedPercent !== null) {
      objective.managerAdjustedPercent = managerAdjustedPercent;
      objective.weightedScore = (objective.weight * managerAdjustedPercent) / 100;
    } else if (objective.achievementPercent !== null) {
      objective.weightedScore = (objective.weight * objective.achievementPercent) / 100;
    }
    if (managerComments !== undefined) {
      objective.managerComments = managerComments;
    }
    objective.validatedBy = req.user.id;
    objective.validatedAt = new Date();
    await objective.save();

    const statusStr = objective.status === 'validated' ? 'approved' : 'rejected';
    await createNotification(objective.owner, `Objective ${statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}`, `Your objective "${objective.title}" was ${statusStr}.`, `/goals`);

    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete objective
exports.deleteObjective = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id).populate('cycle');
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const isOwner = String(objective.owner) === String(req.user.id);
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the owner or admin can delete.' });
    }
    if (objective.cycle && objective.cycle.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot delete from a closed cycle.' });
    }
    if (req.user.role === 'COLLABORATOR' && objective.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft objectives can be deleted.' });
    }
    await Objective.deleteOne({ _id: objective._id });
    res.json({ success: true, message: 'Objective deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== NEW GOAL METHODS ==========

// Update goal status
exports.updateGoalStatus = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const { goalStatus } = req.body;
    if (!goalStatus) return res.status(400).json({ success: false, message: 'goalStatus is required.' });
    objective.goalStatus = goalStatus;
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add KPI
exports.addKpi = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const { title, metricType, initialValue, targetValue, currentValue, unit } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'KPI title is required.' });
    objective.kpis.push({ title, metricType: metricType || 'percent', initialValue: initialValue || 0, targetValue: targetValue || 100, currentValue: currentValue || 0, unit: unit || '' });
    objective.achievementPercent = calculateKpiProgress(objective.kpis);
    objective.weightedScore = (objective.weight * objective.achievementPercent) / 100;
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update KPI
exports.updateKpi = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const kpi = objective.kpis.id(req.params.kpiId);
    if (!kpi) return res.status(404).json({ success: false, message: 'KPI not found.' });
    const { title, metricType, initialValue, targetValue, currentValue, unit, status } = req.body;
    if (title !== undefined) kpi.title = title;
    if (metricType !== undefined) kpi.metricType = metricType;
    if (initialValue !== undefined) kpi.initialValue = initialValue;
    if (targetValue !== undefined) kpi.targetValue = targetValue;
    if (currentValue !== undefined) kpi.currentValue = currentValue;
    if (unit !== undefined) kpi.unit = unit;
    if (status !== undefined) kpi.status = status;
    objective.achievementPercent = calculateKpiProgress(objective.kpis);
    objective.weightedScore = (objective.weight * objective.achievementPercent) / 100;
    await objective.save();

    const team = await Team.findOne({ members: objective.owner });
    if (team && team.leader && String(req.user.id) === String(objective.owner)) {
      const user = await User.findById(req.user.id);
      await createNotification(team.leader, 'KPI Updated', `${user ? user.name : 'A team member'} updated a KPI for "${objective.title}".`, `/evaluations`);
    }

    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete KPI
exports.deleteKpi = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    objective.kpis = objective.kpis.filter(k => String(k._id) !== req.params.kpiId);
    objective.achievementPercent = objective.kpis.length > 0 ? calculateKpiProgress(objective.kpis) : null;
    if (objective.achievementPercent !== null) {
      objective.weightedScore = (objective.weight * objective.achievementPercent) / 100;
    }
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add progress update
exports.addProgressUpdate = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });
    objective.progressUpdates.push({ user: req.user.id, message });
    await objective.save();
    const updated = await Objective.findById(req.params.id).populate('progressUpdates.user', 'name email');
    res.json({ success: true, objective: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required.' });
    objective.comments.push({ user: req.user.id, text });
    await objective.save();

    if (String(req.user.id) !== String(objective.owner)) {
      const commenter = await User.findById(req.user.id);
      await createNotification(
        objective.owner, 
        'New Comment on Objective', 
        `${commenter ? commenter.name : 'Someone'} commented on your objective "${objective.title}".`, 
        `/goals`
      );
    } else {
      const team = await Team.findOne({ members: objective.owner });
      if (team && team.leader) {
        const user = await User.findById(req.user.id);
        await createNotification(
          team.leader,
          'New Comment on Objective',
          `${user ? user.name : 'A team member'} added a comment on "${objective.title}".`,
          `/evaluations`
        );
      }
    }

    const updated = await Objective.findById(req.params.id).populate('comments.user', 'name email');
    res.json({ success: true, objective: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const objective = await Objective.findById(req.params.id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found.' });
    objective.comments = objective.comments.filter(c => String(c._id) !== req.params.commentId);
    await objective.save();
    res.json({ success: true, objective });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get sub-objectives (children)
exports.getSubObjectives = async (req, res) => {
  try {
    const children = await Objective.find({ parentObjective: req.params.id })
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, objectives: children });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Duplicate objective
exports.duplicateObjective = async (req, res) => {
  try {
    const source = await Objective.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Objective not found.' });
    const duplicate = await Objective.create({
      title: source.title + ' (Copy)',
      description: source.description,
      successIndicator: source.successIndicator,
      owner: req.user.id,
      cycle: source.cycle,
      category: source.category,
      weight: source.weight,
      deadline: source.deadline,
      status: 'draft',
      labels: source.labels,
      visibility: source.visibility,
      startDate: source.startDate,
      goalStatus: 'no_status',
      kpis: source.kpis.map(k => ({ title: k.title, metricType: k.metricType, initialValue: k.initialValue, targetValue: k.targetValue, currentValue: k.initialValue, unit: k.unit })),
    });
    res.status(201).json({ success: true, objective: duplicate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: calculate overall KPI progress
function calculateKpiProgress(kpis) {
  if (!kpis || kpis.length === 0) return 0;
  let totalProgress = 0;
  kpis.forEach(kpi => {
    if (kpi.metricType === 'boolean') {
      totalProgress += kpi.currentValue >= 1 ? 100 : 0;
    } else {
      const range = kpi.targetValue - kpi.initialValue;
      if (range <= 0) {
        totalProgress += 100;
      } else {
        const progress = ((kpi.currentValue - kpi.initialValue) / range) * 100;
        totalProgress += Math.min(100, Math.max(0, progress));
      }
    }
  });
  return Math.round(totalProgress / kpis.length);
}