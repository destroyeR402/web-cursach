'use strict';

const { query } = require('../config/database');

async function log({ userId = null, action, entity = null, entityId = null, meta = null, ip = null, userAgent = null }) {
  await query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, meta, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, action, entity, entityId, meta, ip, userAgent]
  );
}

async function list({ limit = 100, offset = 0, userId = null, action = null } = {}) {
  const params = [limit, offset];
  const where = [];
  if (userId) { params.push(userId); where.push(`user_id = $${params.length}`); }
  if (action) { params.push(action); where.push(`action = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT al.*, u.username, u.email
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     ${whereSql} ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

module.exports = { log, list };
