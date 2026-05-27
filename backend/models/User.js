'use strict';

const { query } = require('../config/database');

const SELECT = `
  SELECT u.id, u.email, u.username, u.password_hash, u.display_name, u.avatar_path,
         u.is_active, u.last_login_at, u.failed_attempts, u.created_at, u.updated_at,
         r.code AS role, r.id AS role_id
  FROM users u JOIN roles r ON r.id = u.role_id
`;

const USER_SORT_COLUMNS = {
  id: 'u.id',
  email: 'u.email',
  username: 'u.username',
  display_name: 'u.display_name',
  role: 'r.code',
  is_active: 'u.is_active',
  created_at: 'u.created_at',
};

function buildUserFilters({ search, role, isActive } = {}) {
  const params = [];
  const where = [];
  if (search) {
    params.push(`%${search}%`);
    where.push(`(u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.display_name ILIKE $${params.length})`);
  }
  if (role) { params.push(role); where.push(`r.code = $${params.length}`); }
  if (isActive === true || isActive === false) {
    params.push(isActive); where.push(`u.is_active = $${params.length}`);
  }
  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function findById(id) {
  const { rows } = await query(`${SELECT} WHERE u.id = $1`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await query(`${SELECT} WHERE LOWER(u.email) = LOWER($1)`, [email]);
  return rows[0] || null;
}

async function findByUsername(username) {
  const { rows } = await query(`${SELECT} WHERE LOWER(u.username) = LOWER($1)`, [username]);
  return rows[0] || null;
}

async function create({ email, username, passwordHash, roleCode = 'client', displayName = null }) {
  const { rows } = await query(
    `INSERT INTO users (email, username, password_hash, role_id, display_name)
     SELECT $1, $2, $3, r.id, $4 FROM roles r WHERE r.code = $5
     RETURNING id`,
    [email, username, passwordHash, displayName, roleCode]
  );
  return findById(rows[0].id);
}

async function updateProfile(id, { displayName, avatarPath }) {
  await query(
    `UPDATE users SET
       display_name = COALESCE($2, display_name),
       avatar_path  = COALESCE($3, avatar_path),
       updated_at   = NOW()
     WHERE id = $1`,
    [id, displayName, avatarPath]
  );
  return findById(id);
}

async function updateLastLogin(id, ok) {
  if (ok) {
    await query('UPDATE users SET last_login_at = NOW(), failed_attempts = 0 WHERE id = $1', [id]);
  } else {
    await query('UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = $1', [id]);
  }
}

async function setActive(id, isActive) {
  await query('UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1', [id, isActive]);
  return findById(id);
}

async function changeRole(id, roleCode) {
  await query(
    `UPDATE users SET role_id = (SELECT id FROM roles WHERE code = $2), updated_at = NOW() WHERE id = $1`,
    [id, roleCode]
  );
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  await query(
    'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
    [id, passwordHash]
  );
}

async function remove(id) {
  await query('DELETE FROM users WHERE id = $1', [id]);
}

async function profileStats(userId) {
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM favorites     WHERE user_id = $1 AND target_type = 'channel') AS fav_channels,
       (SELECT COUNT(*)::int FROM favorites     WHERE user_id = $1 AND target_type = 'program') AS fav_programs,
       (SELECT COUNT(*)::int FROM subscriptions WHERE user_id = $1) AS subs`,
    [userId]
  );
  return rows[0] || { fav_channels: 0, fav_programs: 0, subs: 0 };
}

async function list({
  limit = 50, offset = 0,
  search = '', role = null, isActive = null,
  sortBy = 'created_at', sortDir = 'desc',
} = {}) {
  const { where, params } = buildUserFilters({ search, role, isActive });
  const col = USER_SORT_COLUMNS[sortBy] || USER_SORT_COLUMNS.created_at;
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  params.push(limit, offset);
  const { rows } = await query(
    `${SELECT} ${where} ORDER BY ${col} ${dir}, u.id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function count({ search = '', role = null, isActive = null } = {}) {
  const { where, params } = buildUserFilters({ search, role, isActive });
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
    params
  );
  return rows[0].n;
}

async function roleCounts() {
  const { rows } = await query(
    `SELECT r.code, COUNT(u.id)::int AS n
     FROM roles r LEFT JOIN users u ON u.role_id = r.id
     GROUP BY r.code`
  );
  return rows.reduce((acc, r) => { acc[r.code] = r.n; return acc; }, {});
}

function publicFields(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

module.exports = {
  findById, findByEmail, findByUsername, create, updateProfile,
  updateLastLogin, setActive, changeRole,
  updatePassword, remove, profileStats,
  list, count, roleCounts, publicFields,
};
