'use strict';

const userModel = require('../models/User');
const auditLog  = require('../models/AuditLog');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const jwtCfg = require('../config/jwt.config');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

async function register({ email, username, password, displayName }, ctx = {}) {
  if (!EMAIL_RE.test(email)) throw err(400, 'INVALID_EMAIL', 'Некорректный email');
  if (!USERNAME_RE.test(username)) throw err(400, 'INVALID_USERNAME', 'Логин 3–32 символа: латиница/цифры/._-');
  if (!password || password.length < 6) throw err(400, 'WEAK_PASSWORD', 'Пароль должен быть не менее 6 символов');

  if (await userModel.findByEmail(email))    throw err(409, 'EMAIL_TAKEN', 'Email уже зарегистрирован');
  if (await userModel.findByUsername(username)) throw err(409, 'USERNAME_TAKEN', 'Логин занят');

  const passwordHash = await hashPassword(password);
  const user = await userModel.create({ email, username, passwordHash, roleCode: 'client', displayName });

  await auditLog.log({ userId: user.id, action: 'user.register', ip: ctx.ip, userAgent: ctx.userAgent });
  return userModel.publicFields(user);
}

async function login({ identifier, password }, ctx = {}) {
  const user = EMAIL_RE.test(identifier)
    ? await userModel.findByEmail(identifier)
    : await userModel.findByUsername(identifier);

  if (!user || !user.is_active) throw err(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await userModel.updateLastLogin(user.id, false);
    await auditLog.log({ userId: user.id, action: 'user.login.fail', ip: ctx.ip, userAgent: ctx.userAgent });
    throw err(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
  }
  await userModel.updateLastLogin(user.id, true);
  await auditLog.log({ userId: user.id, action: 'user.login.ok', ip: ctx.ip, userAgent: ctx.userAgent });
  return userModel.publicFields(user);
}

function getTokenPayload(user) {
  return { sub: user.id, role: user.role, username: user.username };
}

function issueToken(user) {
  return jwtCfg.sign(getTokenPayload(user));
}

function err(status, code, message) {
  const e = new Error(message); e.status = status; e.code = code; return e;
}

module.exports = { register, login, issueToken, getTokenPayload };
