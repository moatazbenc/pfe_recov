// controllers/userController.js
// User controller: fetch users for team dropdowns

const User = require('../models/User');

/**
 * Get users filtered by role(s)
 * Query params:
 *   - role: single role or comma-separated roles (e.g., "Manager" or "Manager,Collaborator")
 *   - excludeTeamId: exclude users already in a team (optional)
 * 
 * GET /api/users?role=Manager
 * GET /api/users?role=Collaborator
 * GET /api/users?role=Manager,Collaborator
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, excludeAssigned } = req.query;
    
    let filter = {};
    
    // Filter by role(s)
    if (role) {
      const roles = role.split(',').map(r => r.trim());
      filter.role = { $in: roles };
    }
    
    // Optionally exclude users already assigned to a team
    // (useful for collaborators who shouldn't be in multiple teams)
    if (excludeAssigned === 'true') {
      filter.teamId = { $in: [null, undefined] };
    }
    
    const users = await User.find(filter)
      .select('_id name email role')
      .sort({ name: 1 });
    
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all managers (convenience endpoint)
 * GET /api/users/managers
 */
exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'Manager' })
      .select('_id name email')
      .sort({ name: 1 });
    
    res.json({ success: true, users: managers });
  } catch (err) {
    console.error('Error fetching managers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all collaborators (convenience endpoint)
 * GET /api/users/collaborators
 */
exports.getCollaborators = async (req, res) => {
  try {
    const collaborators = await User.find({ role: 'Collaborator' })
      .select('_id name email')
      .sort({ name: 1 });
    
    res.json({ success: true, users: collaborators });
  } catch (err) {
    console.error('Error fetching collaborators:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};