// Input validation middleware for Express routes
// Usage: validate(schema) where schema is a Joi validation schema
// Returns 400 if validation fails

const Joi = require('joi');

module.exports = function (schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
  };
};
