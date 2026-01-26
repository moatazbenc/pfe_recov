// routes/users.js
// User routes for fetching users (for dropdowns)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get users (HR only - for team management dropdowns)
router.get('/', auth, role('HR'), userController.getUsers);

// Convenience endpoints
router.get('/managers', auth, role('HR'), userController.getManagers);
router.get('/collaborators', auth, role('HR'), userController.getCollaborators);

module.exports = router;