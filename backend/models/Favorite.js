'use strict';

const { query } = require('../config/database');

const CHANNEL_SORT = {
  added_at: 'f.created_at',
  name: 'c.name',
  category: 'c.category',
};

const PROGRAM_SORT = {
  added_at: 'f.created_at',
  title: 'p.title',
  duration: 'p.duration_min',
};

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

async function listChannels(userId, { search = '', sortBy = 'added_at', sortDir = 'desc', limit = 12, offset = 0 } = {}) {
  const params = [userId];
  const where = [`f.user_id = $1`, `f.target_type = 'channel'`];
  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    where.push(`(c.name ILIKE $${i} OR COALESCE(c.description,'') ILIKE $${i} OR COALESCE(c.category,'') ILIKE $${i})`);
  }
  const col = CHANNEL_SORT[sortBy] || CHANNEL_SORT.added_at;
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT f.id AS fav_id, f.created_at AS added_at,
            c.id, c.slug, c.name, c.description, c.logo_path, c.category, c.is_active
     FROM favorites f
     JOIN channels c ON c.id = f.target_id
     WHERE ${where.join(' AND ')}
     ORDER BY ${col} ${dir}, c.id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function countChannels(userId, { search = '' } = {}) {
  const params = [userId];
  const where = [`f.user_id = $1`, `f.target_type = 'channel'`];
  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    where.push(`(c.name ILIKE $${i} OR COALESCE(c.description,'') ILIKE $${i} OR COALESCE(c.category,'') ILIKE $${i})`);
  }
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n
     FROM favorites f JOIN channels c ON c.id = f.target_id
     WHERE ${where.join(' AND ')}`,
    params
  );
  return rows[0].n;
}

async function listPrograms(userId, { search = '', sortBy = 'added_at', sortDir = 'desc', limit = 12, offset = 0 } = {}) {
  const params = [userId];
  const where = [`f.user_id = $1`, `f.target_type = 'program'`];
  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    where.push(`(p.title ILIKE $${i} OR COALESCE(p.description,'') ILIKE $${i})`);
  }
  const col = PROGRAM_SORT[sortBy] || PROGRAM_SORT.added_at;
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT f.id AS fav_id, f.created_at AS added_at,
            p.id, p.title, p.description, p.poster_path, p.duration_min,
            g.name AS genre_name, g.code AS genre_code,
            ar.code AS age_code, ar.min_age,
            s.notify_email, s.notify_push,
            (s.id IS NOT NULL) AS has_subscription
     FROM favorites f
     JOIN programs p ON p.id = f.target_id
     LEFT JOIN genres g       ON g.id = p.genre_id
     LEFT JOIN age_ratings ar ON ar.id = p.age_rating_id
     LEFT JOIN subscriptions s ON s.user_id = f.user_id
                              AND s.target_type = 'program'
                              AND s.target_id = p.id
     WHERE ${where.join(' AND ')}
     ORDER BY ${col} ${dir}, p.id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function countPrograms(userId, { search = '' } = {}) {
  const params = [userId];
  const where = [`f.user_id = $1`, `f.target_type = 'program'`];
  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    where.push(`(p.title ILIKE $${i} OR COALESCE(p.description,'') ILIKE $${i})`);
  }
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n
     FROM favorites f JOIN programs p ON p.id = f.target_id
     WHERE ${where.join(' AND ')}`,
    params
  );
  return rows[0].n;
}

module.exports = {
  list, add, remove, has,
  listChannels, countChannels,
  listPrograms, countPrograms,
};
