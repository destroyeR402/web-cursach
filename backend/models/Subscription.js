'use strict';

const { query } = require('../config/database');

async function list(userId) {
  const { rows } = await query(
    `SELECT id, target_type, target_id, notify_email, notify_push, created_at
     FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function add(userId, type, targetId, { notifyEmail = true, notifyPush = false } = {}) {
  const { rows } = await query(
    `INSERT INTO subscriptions (user_id, target_type, target_id, notify_email, notify_push)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, target_type, target_id)
     DO UPDATE SET notify_email = EXCLUDED.notify_email, notify_push = EXCLUDED.notify_push
     RETURNING *`,
    [userId, type, targetId, notifyEmail, notifyPush]
  );
  return rows[0];
}

async function remove(userId, type, targetId) {
  await query(
    'DELETE FROM subscriptions WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
    [userId, type, targetId]
  );
}

async function findSubscribers(type, targetId) {
  const { rows } = await query(
    `SELECT s.user_id, u.email, u.username, s.notify_email, s.notify_push
     FROM subscriptions s JOIN users u ON u.id = s.user_id
     WHERE s.target_type = $1 AND s.target_id = $2 AND u.is_active = TRUE`,
    [type, targetId]
  );
  return rows;
}

module.exports = { list, add, remove, findSubscribers };
