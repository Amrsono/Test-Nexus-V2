const validate = (schema) => (req, res, next) => {
  const errors = [];
  
  Object.keys(schema).forEach((key) => {
    const rules = schema[key];
    const val = req.body[key] !== undefined ? req.body[key] : req.query[key];

    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`Field '${key}' is required.`);
      return;
    }

    if (val !== undefined && val !== null && val !== '') {
      if (rules.type && typeof val !== rules.type) {
        errors.push(`Field '${key}' must be of type '${rules.type}'.`);
      }
      if (rules.pattern && !rules.pattern.test(String(val))) {
        errors.push(`Field '${key}' format is invalid.`);
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

module.exports = validate;
