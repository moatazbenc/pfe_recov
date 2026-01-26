const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Register user (HR or Admin)
router.post('/register', auth, role(['HR', 'Admin']), authController.register);

// Login (public)
router.post('/login', authController.login);

module.exports = router;