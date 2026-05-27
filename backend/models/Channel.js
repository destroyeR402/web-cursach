'use strict';

const { query } = require('../config/database');

const CHANNEL_SORT_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  category: 'category',
  is_active: 'is_active',
  created_at: 'created_at',
};

function buildChannelFilters({ activeOnly, isActive, search, category } = {}) {
  const params = [];
  const where = [];
  if (activeOnly) where.push('is_active = TRUE');
  if (isActive === true || isActive === false) {
    params.push(isActive); where.push(`is_active = $${params.length}`);
  }
  if (category) { params.push(category); where.push(`category = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    where.push(`(name ILIKE $${i} OR slug ILIKE $${i} OR COALESCE(description,'') ILIKE $${i} OR COALESCE(category,'') ILIKE $${i})`);
  }
  return { where: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list({
  activeOnly = true, search = '', category = null, isActive = null,
  sortBy = 'name', sortDir = 'asc',
  limit = null, offset = 0,
} = {}) {
  const { where, params } = buildChannelFilters({ activeOnly, isActive, search, category });
  const col = CHANNEL_SORT_COLUMNS[sortBy] || CHANNEL_SORT_COLUMNS.name;
  const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  let limitSql = '';
  if (limit !== null) {
    params.push(limit, offset);
    limitSql = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  const { rows } = await query(
    `SELECT id, slug, name, description, logo_path, category, is_active, created_at, updated_at
     FROM channels ${where} ORDER BY ${col} ${dir}, id ASC ${limitSql}`,
    params
  );
  return rows;
}

async function count({ activeOnly = false, isActive = null, search = '', category = null } = {}) {
  const { where, params } = buildChannelFilters({ activeOnly, isActive, search, category });
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM channels ${where}`, params);
  return rows[0].n;
}

async function distinctCategories() {
  const { rows } = await query(
    `SELECT DISTINCT category FROM channels WHERE category IS NOT NULL AND category <> '' ORDER BY category`
  );
  return rows.map((r) => r.category);
}

async function activityCounts() {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total,
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END)::int AS active,
       SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END)::int AS inactive,
       COUNT(DISTINCT category) FILTER (WHERE category IS NOT NULL AND category <> '')::int AS categories
     FROM channels`
  );
  return rows[0] || { total: 0, active: 0, inactive: 0, categories: 0 };
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
  list, count, distinctCategories, activityCounts,
  findById, findByIds, findBySlug, create, update, remove,
  assignEditor, unassignEditor, isEditorOf, editorChannels,
};
