'use strict';

const { query } = require('../config/database');

async function list(userId, type = null) {
  const params = [userId];
  let where = 'WHERE user_id = $1';
  if (type) { params.push(type); where += ` AND target_type = $2`; }
  const { rows } = await query(
    `SELECT id, target_type, target_id, created_at FROM favorites ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

async function add(userId, type, targetId) {
  const { rows } = await query(
    `INSERT INTO favorites (user_id, target_type, target_id) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, target_type, target_id) DO NOTHING
     RETURNING id`,
    [userId, type, targetId]
  );
  return rows[0] || null;
}

async function remove(userId, type, targetId) {
  await query(
    'DELETE FROM favorites WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
    [userId, type, targetId]
  );
}

async function has(userId, type, targetId) {
  const { rows } = await query(
    'SELECT 1 FROM favorites WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
    [userId, type, targetId]
  );
  return rows.length > 0;
}

module.exports = { list, add, remove, has };
