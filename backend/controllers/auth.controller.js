'use strict';

const authService = require('../services/auth.service');
const userModel = require('../models/User');
const { ok, created, fail } = require('../utils/response.util');
const jwtCfg = require('../config/jwt.config');

function ctxFromReq(req) {
  return { ip: req.ip, userAgent: req.get('user-agent') };
}

async function postRegister(req, res, next) {
  try {
    const user = await authService.register(req.body, ctxFromReq(req));
    if (req.session) req.session.userId = user.id;
    const token = authService.issueToken(user);
    res.cookie(jwtCfg.COOKIE_NAME, token, jwtCfg.cookieOptions());
    if (req.accepts('html') && !req.xhr) return res.redirect('/');
    return created(res, { user, token });
  } catch (err) { next(err); }
}

async function postLogin(req, res, next) {
  try {
    const user = await authService.login(
      { identifier: req.body.identifier || req.body.email || req.body.username, password: req.body.password },
      ctxFromReq(req)
    );
    if (req.session) req.session.userId = user.id;
    const token = authService.issueToken(user);
    res.cookie(jwtCfg.COOKIE_NAME, token, jwtCfg.cookieOptions());
    const next_ = req.body.next || req.query.next;
    if (req.accepts('html') && !req.xhr) return res.redirect(typeof next_ === 'string' && next_.startsWith('/') ? next_ : '/');
    return ok(res, { user, token });
  } catch (err) { next(err); }
}

async function postLogout(req, res, next) {
  try {
    if (req.session) await new Promise((r) => req.session.destroy(r));
    res.clearCookie(jwtCfg.COOKIE_NAME);
    if (req.accepts('html') && !req.xhr) return res.redirect('/');
    return ok(res, { loggedOut: true });
  } catch (err) { next(err); }
}

function getMe(req, res) {
  if (!req.user) return fail(res, 401, 'UNAUTHORIZED', 'Не авторизован');
  return ok(res, { user: userModel.publicFields(req.user) });
}

async function patchProfile(req, res, next) {
  try {
    const avatarPath = req.file ? `/images/avatars/${req.file.filename}` : undefined;
    const updated = await userModel.updateProfile(req.user.id, {
      displayName: req.body.displayName,
      avatarPath,
    });
    return ok(res, { user: userModel.publicFields(updated) });
  } catch (err) { next(err); }
}

function renderLogin(req, res) {
  res.render('auth/login', { title: 'Вход', next: req.query.next || '/' });
}

function renderRegister(req, res) {
  res.render('auth/register', { title: 'Регистрация' });
}

function renderProfile(req, res) {
  res.render('auth/profile', { title: 'Профиль' });
}

module.exports = {
  postRegister, postLogin, postLogout, getMe, patchProfile,
  renderLogin, renderRegister, renderProfile,
};
