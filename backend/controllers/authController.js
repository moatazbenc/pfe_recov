// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// Register new user (HR only – enforced in routes with middleware)
exports.register = async (req, res) => {
  console.log('REGISTER body:', req.body); // DEBUG

  try {
    const { name, email, password, role, team } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields required' });
    }

    const exists = await User.findOne({ email });
    console.log('REGISTER user exists:', !!exists); // DEBUG

    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, team });
    console.log('REGISTER user created:', user._id); // DEBUG

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
      },
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message }); // <--- show real error
  }
};

// Login
exports.login = async (req, res) => {
  console.log('LOGIN body:', req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    console.log('LOGIN user found:', !!user);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message }); // same here
  }
};