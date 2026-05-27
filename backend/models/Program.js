'use strict';

const { query } = require('../config/database');

const SELECT = `
  SELECT p.*, g.name AS genre_name, g.code AS genre_code,
         ar.code AS age_code, ar.min_age
  FROM programs p
  LEFT JOIN genres g       ON g.id  = p.genre_id
  LEFT JOIN age_ratings ar ON ar.id = p.age_rating_id
`;

async function findById(id) {
  const { rows } = await query(`${SELECT} WHERE p.id = $1`, [id]);
  return rows[0] || null;
}

async function findByIds(ids) {
  if (!ids || !ids.length) return [];
  const { rows } = await query(`${SELECT} WHERE p.id = ANY($1) ORDER BY p.title`, [ids]);
  return rows;
}

async function list({ limit = 50, offset = 0, search = '', genreId = null, ageMax = null } = {}) {
  const params = [limit, offset];
  const where = ['p.is_archived = FALSE'];
  if (search) { params.push(`%${search}%`); where.push(`p.title ILIKE $${params.length}`); }
  if (genreId) { params.push(genreId); where.push(`p.genre_id = $${params.length}`); }
  if (ageMax !== null) { params.push(ageMax); where.push(`(ar.min_age IS NULL OR ar.min_age <= $${params.length})`); }
  const { rows } = await query(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY p.title LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

async function create({ title, description, posterPath, durationMin, genreId, ageRatingId }) {
  const { rows } = await query(
    `INSERT INTO programs (title, description, poster_path, duration_min, genre_id, age_rating_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [title, description, posterPath, durationMin, genreId, ageRatingId]
  );
  return findById(rows[0].id);
}

async function update(id, { title, description, posterPath, durationMin, genreId, ageRatingId }) {
  await query(
    `UPDATE programs SET
       title         = COALESCE($2, title),
       description   = COALESCE($3, description),
       poster_path   = COALESCE($4, poster_path),
       duration_min  = COALESCE($5, duration_min),
       genre_id      = COALESCE($6, genre_id),
       age_rating_id = COALESCE($7, age_rating_id),
       updated_at    = NOW()
     WHERE id = $1`,
    [id, title, description, posterPath, durationMin, genreId, ageRatingId]
  );
  return findById(id);
}

async function archive(id) {
  await query('UPDATE programs SET is_archived = TRUE, updated_at = NOW() WHERE id = $1', [id]);
}

async function remove(id) {
  await query('DELETE FROM programs WHERE id = $1', [id]);
}

module.exports = { findById, findByIds, list, create, update, archive, remove };
