// Objective routes: CRUD, status transitions, protected and role-based
const express = require('express');
const router = express.Router();
const objectiveController = require('../controllers/objectiveController');
const auth = require('../middleware/auth');

// Create objective (Collaborator only)
router.post('/', auth, objectiveController.createObjective);
// Get all objectives (role-based)
router.get('/', auth, objectiveController.getObjectives);
// Get objective by ID (role-based)
router.get('/:id', auth, objectiveController.getObjectiveById);
// Update objective (owner only, draft)
router.put('/:id', auth, objectiveController.updateObjective);
// Delete objective (owner only, draft)
router.delete('/:id', auth, objectiveController.deleteObjective);
// Submit objective (owner only, draft → submitted)
router.post('/:id/submit', auth, objectiveController.submitObjective);
// Validate objective (manager only, submitted → validated)
router.post('/:id/validate', auth, objectiveController.validateObjective);

module.exports = router;
