// controllers/teamController.js
// Team controller: CRUD operations for teams

const Team = require('../models/Team');
const User = require('../models/User');

// Create a new team (HR only)
exports.createTeam = async (req, res) => {
  try {
    const { name, manager, collaborators } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team name is required.' 
      });
    }

    if (!manager) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager is required.' 
      });
    }

    // Validate manager exists and has correct role
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager not found.' 
      });
    }
    if (managerUser.role !== 'Manager') {
      return res.status(400).json({ 
        success: false, 
        message: 'Selected user must have Manager role.' 
      });
    }

    // Check if manager already manages another team
    const existingTeam = await Team.findOne({ manager });
    if (existingTeam) {
      return res.status(409).json({ 
        success: false, 
        message: 'This manager already manages another team.' 
      });
    }

    // Validate collaborators if provided
    if (collaborators && collaborators.length > 0) {
      const users = await User.find({ 
        _id: { $in: collaborators }, 
        role: 'Collaborator' 
      });
      if (users.length !== collaborators.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'All collaborators must be valid users with role Collaborator.' 
        });
      }
    }

    // Check for duplicate team name
    const duplicateName = await Team.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (duplicateName) {
      return res.status(409).json({ 
        success: false, 
        message: 'A team with this name already exists.' 
      });
    }

    // Create the team
    const team = await Team.create({ 
      name: name.trim(), 
      manager, 
      collaborators: collaborators || [] 
    });

    // Populate and return
    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email');

    res.status(201).json({ success: true, team: populatedTeam });

  } catch (err) {
    console.error('Create team error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A team with this name already exists.' 
      });
    }
    
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all teams (HR and Manager)
exports.getTeams = async (req, res) => {
  try {
    let filter = {};
    
    // Managers can only see their own team
    if (req.user.role === 'Manager') {
      filter.manager = req.user.id || req.user._id;
    }
    
    const teams = await Team.find(filter)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email')
      .sort({ name: 1 });
      
    res.json({ success: true, teams });
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single team by ID
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email');
      
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found.' 
      });
    }

    // Authorization check
    const userId = req.user.id || req.user._id;
    const isHR = req.user.role === 'HR' || req.user.role === 'Admin';
    const isManager = team.manager._id.toString() === userId.toString();
    const isCollaborator = team.collaborators.some(
      (c) => c._id.toString() === userId.toString()
    );

    if (!isHR && !isManager && !isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    res.json({ success: true, team });
  } catch (err) {
    console.error('Get team by ID error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update team (HR only)
exports.updateTeam = async (req, res) => {
  try {
    const { name, manager, collaborators } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found.' 
      });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Team name cannot be empty.' 
        });
      }
      
      // Check for duplicate name (excluding current team)
      const duplicateName = await Team.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: team._id }
      });
      if (duplicateName) {
        return res.status(409).json({ 
          success: false, 
          message: 'A team with this name already exists.' 
        });
      }
      
      team.name = name.trim();
    }

    // Validate and update manager if provided
    if (manager && manager !== team.manager.toString()) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Manager not found.' 
        });
      }
      if (managerUser.role !== 'Manager') {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected user must have Manager role.' 
        });
      }

      // Check if new manager already manages another team
      const existingTeam = await Team.findOne({ 
        manager, 
        _id: { $ne: team._id } 
      });
      if (existingTeam) {
        return res.status(409).json({ 
          success: false, 
          message: 'This manager already manages another team.' 
        });
      }

      team.manager = manager;
    }

    // Validate and update collaborators if provided
    if (collaborators !== undefined) {
      if (collaborators.length > 0) {
        const users = await User.find({ 
          _id: { $in: collaborators }, 
          role: 'Collaborator' 
        });
        if (users.length !== collaborators.length) {
          return res.status(400).json({ 
            success: false, 
            message: 'All collaborators must be valid users with role Collaborator.' 
          });
        }
      }
      team.collaborators = collaborators;
    }

    await team.save();

    // Populate and return
    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email');

    res.json({ success: true, team: populatedTeam });

  } catch (err) {
    console.error('Update team error:', err);
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A team with this name already exists.' 
      });
    }
    
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete team (HR only)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found.' 
      });
    }

    // Optional: Check if team has active objectives before deleting
    // Uncomment if you have Objective model and want to enforce this
    /*
    const Objective = require('../models/Objective');
    const activeObjectives = await Objective.countDocuments({ 
      team: team._id, 
      status: { $in: ['active', 'in_progress'] } 
    });
    if (activeObjectives > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete team with ${activeObjectives} active objective(s).` 
      });
    }
    */

    await Team.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Team deleted successfully.' });

  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};