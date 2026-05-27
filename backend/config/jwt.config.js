'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'dev-only-jwt-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'tv_sched_token';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

module.exports = { sign, verify, cookieOptions, COOKIE_NAME, EXPIRES_IN };
