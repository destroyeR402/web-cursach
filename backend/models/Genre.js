'use strict';

const { query } = require('../config/database');

async function list() {
  const { rows } = await query('SELECT id, code, name, description FROM genres ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM genres WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ code, name, description }) {
  const { rows } = await query(
    'INSERT INTO genres (code, name, description) VALUES ($1, $2, $3) RETURNING *',
    [code, name, description]
  );
  return rows[0];
}

async function update(id, { name, description }) {
  const { rows } = await query(
    `UPDATE genres SET
       name = COALESCE($2, name),
       description = COALESCE($3, description)
     WHERE id = $1 RETURNING *`,
    [id, name, description]
  );
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM genres WHERE id = $1', [id]);
}

module.exports = { list, findById, create, update, remove };
