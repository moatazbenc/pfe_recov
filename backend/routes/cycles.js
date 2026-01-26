const express = require('express');
const router = express.Router();
const controller = require('../controllers/cycleController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, controller.getCycles);
router.get('/current', auth, controller.getCurrentCycles);
router.get('/year/:year', auth, controller.getCyclesByYear);
router.get('/:id', auth, controller.getCycleById);

router.post('/', auth, role('HR', 'Admin'), controller.createCycle);
router.put('/:id', auth, role('HR', 'Admin'), controller.updateCycle);
router.delete('/:id', auth, role('HR', 'Admin'), controller.deleteCycle);
router.post('/:id/open', auth, role('HR', 'Admin'), controller.openCycle);
router.post('/:id/close', auth, role('HR', 'Admin'), controller.closeCycle);

module.exports = router;