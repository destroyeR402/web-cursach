'use strict';

const jwtCfg = require('../config/jwt.config');
const userModel = require('../models/User');

async function attachUser(req, res, next) {
  // гарантируем что user всегда определён в шаблонах (даже для гостей)
  req.user = null;
  res.locals.user = null;
  try {
    if (req.session && req.session.userId) {
      const user = await userModel.findById(req.session.userId);
      if (user) { req.user = user; res.locals.user = user; return next(); }
    }
    const token = req.cookies?.[jwtCfg.COOKIE_NAME] || extractBearer(req);
    if (token) {
      try {
        const payload = jwtCfg.verify(token);
        const user = await userModel.findById(payload.sub);
        if (user) { req.user = user; res.locals.user = user; }
      } catch (_) { /* токен невалиден — продолжаем как гость */ }
    }
    next();
  } catch (err) { next(err); }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.accepts('html') && !req.originalUrl.includes('/api/')) {
      return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
    }
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED', message: 'Требуется авторизация' });
  }
  next();
}

function requireGuest(req, res, next) {
  if (req.user) return res.redirect('/');
  next();
}

function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

module.exports = { attachUser, requireAuth, requireGuest };
