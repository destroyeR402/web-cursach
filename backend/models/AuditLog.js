'use strict';

const { query } = require('../config/database');

const SORT_COLUMNS = {
  created_at: 'al.created_at',
  action: 'al.action',
  entity: 'al.entity',
  username: 'u.username',
  ip: 'al.ip',
};

function buildFilters(opts) {
  const where = [];
  const params = [];
  if (opts.userId) { params.push(opts.userId); where.push(`al.user_id = $${params.length}`); }
  if (opts.action) { params.push(opts.action); where.push(`al.action = $${params.length}`); }
  if (opts.entity) { params.push(opts.entity); where.push(`al.entity = $${params.length}`); }
  if (opts.dateFrom) { params.push(opts.dateFrom); where.push(`al.created_at >= $${params.length}`); }
  if (opts.dateTo) { params.push(opts.dateTo); where.push(`al.created_at <= $${params.length}`); }
  if (opts.search) {
    params.push('%' + opts.search.toLowerCase() + '%');
    const i = params.length;
    where.push(`(LOWER(al.action) LIKE $${i} OR LOWER(COALESCE(al.entity,'')) LIKE $${i}
      OR LOWER(COALESCE(u.username,'')) LIKE $${i} OR LOWER(COALESCE(u.email,'')) LIKE $${i}
      OR COALESCE(al.ip::text,'') LIKE $${i} OR COALESCE(al.entity_id::text,'') LIKE $${i})`);
  }
  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function log({ userId = null, action, entity = null, entityId = null, meta = null, ip = null, userAgent = null }) {
  await query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, meta, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, action, entity, entityId, meta, ip, userAgent]
  );
}

async function list({
  limit = 100, offset = 0,
  userId = null, action = null, entity = null,
  dateFrom = null, dateTo = null, search = null,
  sortBy = 'created_at', sortDir = 'desc',
} = {}) {
  const { where, params } = buildFilters({ userId, action, entity, dateFrom, dateTo, search });
  const col = SORT_COLUMNS[sortBy] || SORT_COLUMNS.created_at;
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT al.*, u.username, u.email, r.code AS role
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     ${where}
     ORDER BY ${col} ${dir}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count(opts = {}) {
  const { where, params } = buildFilters(opts);
  const { rows } = await query(
    `SELECT COUNT(*)::int AS c FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ${where}`,
    params
  );
  return rows[0].c;
}

async function distinctActions() {
  const { rows } = await query(`SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL ORDER BY action`);
  return rows.map((r) => r.action);
}

async function distinctEntities() {
  const { rows } = await query(`SELECT DISTINCT entity FROM audit_logs WHERE entity IS NOT NULL ORDER BY entity`);
  return rows.map((r) => r.entity);
}

module.exports = { log, list, count, distinctActions, distinctEntities };
