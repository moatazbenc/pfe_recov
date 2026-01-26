// KPI CRUD routes for HR system
// Only HR can create, update, delete, and view KPIs

const express = require('express');
const router = express.Router();
const kpiCrudController = require('../controllers/kpiCrudController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create KPI (HR only)
router.post('/', auth, role('HR'), kpiCrudController.createKPI);
// Get all KPIs (HR only)
router.get('/', auth, role('HR'), kpiCrudController.getKPIs);
// Get KPI by ID (HR only)
router.get('/:id', auth, role('HR'), kpiCrudController.getKPIById);
// Update KPI (HR only)
router.put('/:id', auth, role('HR'), kpiCrudController.updateKPI);
// Delete KPI (HR only)
router.delete('/:id', auth, role('HR'), kpiCrudController.deleteKPI);

module.exports = router;
