'use strict';

const { query } = require('../config/database');

async function list() {
  const { rows } = await query('SELECT id, code, min_age, description FROM age_ratings ORDER BY min_age');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM age_ratings WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = { list, findById };
