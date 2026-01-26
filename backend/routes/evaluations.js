// Evaluation routes: CRUD, finalize, protected and role-based
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const auth = require('../middleware/auth');

// Create evaluation (Manager only)
router.post('/', auth, evaluationController.createEvaluation);
// Get all evaluations (role-based)
router.get('/', auth, evaluationController.getEvaluations);
// Get evaluation by ID (role-based)
router.get('/:id', auth, evaluationController.getEvaluationById);
// Finalize evaluation (Manager only)
router.post('/:id/finalize', auth, evaluationController.finalizeEvaluation);

module.exports = router;
