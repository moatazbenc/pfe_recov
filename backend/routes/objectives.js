const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimiter = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const objectiveController = require('../controllers/objectiveController');

// All users can get objectives
router.get('/', rateLimiter, auth, objectiveController.getObjectives);
router.get('/my', rateLimiter, auth, async (req, res) => {
    try {
        const Objective = require('../models/Objective');
        const objectives = await Objective.find({ owner: req.user.id })
            .populate('owner', 'name email role')
            .populate('cycle', 'name year status');
        res.json(objectives);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/user/:userId/cycle/:cycleId', rateLimiter, auth, async (req, res) => {
    // Mock bridging function until we unify Objectives into a more robust single fetch
    // This matches what the frontend is actually calling: GET /api/objectives/user/:uid/cycle/:cid
    req.query.cycle = req.params.cycleId;
    req.query.targetUserId = req.params.userId;
    return objectiveController.getObjectives(req, res);
});

router.get('/pending-validation', rateLimiter, auth, role('TEAM_LEADER'), objectiveController.getPendingValidation);
router.get('/:id', rateLimiter, auth, objectiveController.getObjectiveById);

// Creation and modification allowed by leaders and collaborators
router.post('/', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER', 'COLLABORATOR'), validate(schemas.objective.create), objectiveController.createObjective);
router.put('/:id', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER', 'COLLABORATOR'), validate(schemas.objective.update), objectiveController.updateObjective);
router.delete('/:id', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER', 'COLLABORATOR'), objectiveController.deleteObjective);

// Workflow actions
router.post('/submit-all', rateLimiter, auth, role('COLLABORATOR'), objectiveController.submitObjectives);
router.post('/submit', rateLimiter, auth, objectiveController.submitObjectives);
router.post('/:id/submit', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER', 'COLLABORATOR'), validate(schemas.objective.submitProgress), objectiveController.submitProgress);
router.post('/:id/validate', rateLimiter, auth, role('ADMIN', 'TEAM_LEADER'), validate(schemas.objective.validate), objectiveController.validateObjective);

// === NEW GOAL ROUTES ===
// Goal status
router.put('/:id/goal-status', rateLimiter, auth, objectiveController.updateGoalStatus);

// KPI management
router.post('/:id/kpis', rateLimiter, auth, objectiveController.addKpi);
router.put('/:id/kpis/:kpiId', rateLimiter, auth, objectiveController.updateKpi);
router.delete('/:id/kpis/:kpiId', rateLimiter, auth, objectiveController.deleteKpi);

// Progress updates
router.post('/:id/progress', rateLimiter, auth, objectiveController.addProgressUpdate);

// Comments
router.post('/:id/comments', rateLimiter, auth, objectiveController.addComment);
router.delete('/:id/comments/:commentId', rateLimiter, auth, objectiveController.deleteComment);

// Sub-objectives (children)
router.get('/:id/children', rateLimiter, auth, objectiveController.getSubObjectives);

// Duplicate
router.post('/:id/duplicate', rateLimiter, auth, objectiveController.duplicateObjective);

module.exports = router;