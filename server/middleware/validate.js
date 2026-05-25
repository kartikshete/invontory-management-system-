const { validationResult } = require('express-validator');

/**
 * Express-validator result handler.
 * Call after any express-validator check chain to return
 * 400 with structured error messages if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    return res.status(400).json({ errors: formatted });
  }

  next();
};

module.exports = validate;
