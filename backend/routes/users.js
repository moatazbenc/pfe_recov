const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ownership = require('../middleware/ownership');
const rateLimiter = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Not an image! Please upload an image.'), false);
  }
});

// Get all users (admin only)
router.get('/', rateLimiter, auth, role('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single user (admin only)
router.get('/:id', rateLimiter, auth, role('ADMIN'), ownership(User), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('team', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// No public signup, no direct create route

// Update user (admin only, not self)
router.put('/:id', rateLimiter, auth, role('ADMIN'), ownership(User), validate(schemas.user.update), async (req, res) => {
  try {
    // Users can update their own profile (limited fields)
    if (req.user.id === req.params.id) {
      var { name, email, password } = req.body;
      var updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) {
        var bcrypt = require('bcryptjs');
        var salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      var user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .select('-password')
        .populate('team', 'name');
      return res.json(user);
    }
    // Only admin can update other users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can update other users' });
    }
    var { name, email, role: userRole, team } = req.body;
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (userRole) user.role = userRole;
    if (team !== undefined) user.team = team || null;
    await user.save();
    var populated = await User.findById(user._id)
      .select('-password')
      .populate('team', 'name');
    res.json(populated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user - Admin only
router.delete('/:id', rateLimiter, auth, role('ADMIN'), async function (req, res) {
  try {
    var user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Prevent deleting yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload or Update Avatar
router.put('/:id/avatar', rateLimiter, auth, upload.single('avatar'), async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this avatar' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    const imageUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { profileImage: imageUrl }, 
      { new: true }
    ).select('-password').populate('team', 'name');
    
    res.json(user);
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: err.message || 'Server error during upload' });
  }
});

module.exports = router;