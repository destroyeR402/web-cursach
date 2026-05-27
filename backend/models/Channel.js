'use strict';

const { query } = require('../config/database');

async function list({ activeOnly = true, search = '' } = {}) {
  const params = [];
  const where = [];
  if (activeOnly) where.push('is_active = TRUE');
  if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT id, slug, name, description, logo_path, category, is_active, created_at, updated_at
     FROM channels ${whereSql} ORDER BY name`,
    params
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM channels WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByIds(ids) {
  if (!ids || !ids.length) return [];
  const { rows } = await query('SELECT * FROM channels WHERE id = ANY($1) ORDER BY name', [ids]);
  return rows;
}

async function findBySlug(slug) {
  const { rows } = await query('SELECT * FROM channels WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function create({ slug, name, description, logoPath, category }) {
  const { rows } = await query(
    `INSERT INTO channels (slug, name, description, logo_path, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [slug, name, description, logoPath, category]
  );
  return rows[0];
}

async function update(id, { name, description, logoPath, category, isActive }) {
  const { rows } = await query(
    `UPDATE channels SET
       name        = COALESCE($2, name),
       description = COALESCE($3, description),
       logo_path   = COALESCE($4, logo_path),
       category    = COALESCE($5, category),
       is_active   = COALESCE($6, is_active),
       updated_at  = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, description, logoPath, category, isActive]
  );
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM channels WHERE id = $1', [id]);
}

async function assignEditor(channelId, userId) {
  await query(
    `INSERT INTO channel_editors (channel_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [channelId, userId]
  );
}

async function unassignEditor(channelId, userId) {
  await query('DELETE FROM channel_editors WHERE channel_id = $1 AND user_id = $2', [channelId, userId]);
}

async function isEditorOf(userId, channelId) {
  const { rows } = await query(
    'SELECT 1 FROM channel_editors WHERE user_id = $1 AND channel_id = $2',
    [userId, channelId]
  );
  return rows.length > 0;
}

async function editorChannels(userId) {
  const { rows } = await query(
    `SELECT c.* FROM channels c
     JOIN channel_editors ce ON ce.channel_id = c.id
     WHERE ce.user_id = $1 ORDER BY c.name`,
    [userId]
  );
  return rows;
}

module.exports = {
  list, findById, findByIds, findBySlug, create, update, remove,
  assignEditor, unassignEditor, isEditorOf, editorChannels,
};
