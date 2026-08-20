const validate = (schema, source = 'body') => (req, res, next) => {
  const errors = [];
  const dataSource = source === 'query' ? req.query : (source === 'params' ? req.params : (req.body || {}));

  Object.keys(schema).forEach((key) => {
    const rules = schema[key];
    const val = dataSource !== undefined && dataSource !== null ? dataSource[key] : undefined;

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
      if (rules.enum && Array.isArray(rules.enum) && !rules.enum.includes(val)) {
        errors.push(`Field '${key}' must be one of: ${rules.enum.join(', ')}.`);
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

module.exports = validate;

