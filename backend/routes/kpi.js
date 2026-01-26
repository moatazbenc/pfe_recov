// KPI routes: team performance, employee ranking, performance evolution
const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Team performance average (HR, Manager)
router.get('/team-performance', auth, role('HR', 'Manager'), kpiController.teamPerformance);
// Employee ranking (HR only)
router.get('/employee-ranking', auth, role('HR'), kpiController.employeeRanking);
// Performance evolution (HR, Manager, Collaborator)
router.get('/performance-evolution', auth, kpiController.performanceEvolution);

module.exports = router;
