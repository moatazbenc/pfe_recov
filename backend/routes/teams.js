// Team routes: CRUD, protected and role-based
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create team (HR only)
router.post('/', auth, role('HR'), teamController.createTeam);
// Get all teams (HR, Manager)
router.get('/', auth, role('HR', 'Manager'), teamController.getTeams);
// Get team by ID (HR, Manager, Collaborator if member)
router.get('/:id', auth, teamController.getTeamById);
// Update team (HR only)
router.put('/:id', auth, role('HR'), teamController.updateTeam);
// Delete team (HR only)
router.delete('/:id', auth, role('HR'), teamController.deleteTeam);

module.exports = router;
