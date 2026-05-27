'use strict';

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
    req.flash = req.flash || (() => {});
    return res.status(400).render('error', {
      title: 'Ошибка валидации',
      status: 400,
      message: formatted.map((f) => `${f.field}: ${f.message}`).join('; '),
      user: req.user || null,
    });
  }
  return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', errors: formatted });
}

module.exports = { validate };
