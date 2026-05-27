'use strict';

const { query } = require('../config/database');

async function list() {
  const { rows } = await query('SELECT id, code, name FROM roles ORDER BY id');
  return rows;
}

async function findByCode(code) {
  const { rows } = await query('SELECT id, code, name FROM roles WHERE code = $1', [code]);
  return rows[0] || null;
}

module.exports = { list, findByCode };
