'use strict';

const { query } = require('../config/database');

const SELECT = `
  SELECT u.id, u.email, u.username, u.password_hash, u.display_name, u.avatar_path,
         u.is_active, u.last_login_at, u.failed_attempts, u.created_at, u.updated_at,
         r.code AS role, r.id AS role_id
  FROM users u JOIN roles r ON r.id = u.role_id
`;

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

async function list({ limit = 50, offset = 0, search = '' } = {}) {
  const params = [limit, offset];
  let where = '';
  if (search) { params.push(`%${search}%`); where = `WHERE u.email ILIKE $3 OR u.username ILIKE $3 OR u.display_name ILIKE $3`; }
  const { rows } = await query(`${SELECT} ${where} ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`, params);
  return rows;
}

async function count({ search = '' } = {}) {
  const params = [];
  let where = '';
  if (search) { params.push(`%${search}%`); where = `WHERE u.email ILIKE $1 OR u.username ILIKE $1 OR u.display_name ILIKE $1`; }
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM users u ${where}`, params);
  return rows[0].n;
}

function publicFields(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

module.exports = {
  findById, findByEmail, findByUsername, create, updateProfile,
  updateLastLogin, setActive, changeRole, list, count, publicFields,
};
