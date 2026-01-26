// HRDecision routes: CRUD, HR-only
const express = require('express');
const router = express.Router();
const hrDecisionController = require('../controllers/hrDecisionController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create HR decision (HR only)
router.post('/', auth, role('HR'), hrDecisionController.createHRDecision);
// Get all HR decisions (HR only)
router.get('/', auth, role('HR'), hrDecisionController.getHRDecisions);
// Get HR decision by ID (HR only)
router.get('/:id', auth, role('HR'), hrDecisionController.getHRDecisionById);
// Update HR decision (HR only)
router.put('/:id', auth, role('HR'), hrDecisionController.updateHRDecision);
// Delete HR decision (HR only)
router.delete('/:id', auth, role('HR'), hrDecisionController.deleteHRDecision);

module.exports = router;
