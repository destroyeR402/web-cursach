'use strict';

const bcrypt = require('bcrypt');
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length < 6) {
    throw Object.assign(new Error('Пароль должен быть не менее 6 символов'), { status: 400 });
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword, SALT_ROUNDS };
