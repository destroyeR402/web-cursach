'use strict';

const authService = require('../services/auth.service');
const userModel = require('../models/User');
const auditModel = require('../models/AuditLog');
const { hashPassword, verifyPassword } = require('../utils/password.util');
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

async function patchPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) return fail(res, 400, 'CURRENT_REQUIRED', 'Введите текущий пароль');
    if (!newPassword || newPassword.length < 6) return fail(res, 400, 'WEAK_PASSWORD', 'Новый пароль должен быть не менее 6 символов');
    if (currentPassword === newPassword) return fail(res, 400, 'SAME_PASSWORD', 'Новый пароль не должен совпадать с текущим');

    const user = await userModel.findById(req.user.id);
    const matches = await verifyPassword(currentPassword, user.password_hash);
    if (!matches) return fail(res, 400, 'BAD_CURRENT', 'Текущий пароль введён неверно');

    await userModel.updatePassword(user.id, await hashPassword(newPassword));
    await auditModel.log({
      userId: user.id, action: 'user.password_change',
      ip: req.ip, userAgent: req.get('user-agent'),
    });
    return ok(res, { changed: true });
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body || {};
    if (!password) return fail(res, 400, 'PASSWORD_REQUIRED', 'Для удаления аккаунта подтвердите пароль');

    const user = await userModel.findById(req.user.id);
    if (user.role === 'admin') return fail(res, 403, 'ADMIN_DELETE_FORBIDDEN', 'Аккаунт администратора нельзя удалить через профиль');

    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) return fail(res, 400, 'BAD_PASSWORD', 'Пароль введён неверно');

    await auditModel.log({
      userId: user.id, action: 'user.self_delete',
      ip: req.ip, userAgent: req.get('user-agent'),
    });
    await userModel.remove(user.id);

    if (req.session) await new Promise((r) => req.session.destroy(r));
    res.clearCookie(jwtCfg.COOKIE_NAME);
    return ok(res, { deleted: true });
  } catch (err) { next(err); }
}

function renderLogin(req, res) {
  res.render('auth/login', { title: 'Вход', next: req.query.next || '/' });
}

function renderRegister(req, res) {
  res.render('auth/register', { title: 'Регистрация' });
}

async function renderProfile(req, res, next) {
  try {
    const stats = await userModel.profileStats(req.user.id);
    res.render('auth/profile', { title: 'Профиль', stats });
  } catch (err) { next(err); }
}

module.exports = {
  postRegister, postLogin, postLogout, getMe,
  patchProfile, patchPassword, deleteAccount,
  renderLogin, renderRegister, renderProfile,
};
