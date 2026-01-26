// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization; // 'Bearer token'

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret'
    );
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err);
    return res
      .status(401)
      .json({ success: false, message: 'Token is not valid' });
  }
};