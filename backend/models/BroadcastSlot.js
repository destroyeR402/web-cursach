'use strict';

const { query } = require('../config/database');

const SELECT = `
  SELECT s.*,
         c.name AS channel_name, c.slug AS channel_slug, c.logo_path AS channel_logo,
         p.title AS program_title, p.poster_path AS program_poster, p.duration_min,
         g.name AS genre_name, ar.code AS age_code
  FROM broadcast_slots s
  JOIN channels c       ON c.id = s.channel_id
  JOIN programs p       ON p.id = s.program_id
  LEFT JOIN genres g       ON g.id  = p.genre_id
  LEFT JOIN age_ratings ar ON ar.id = p.age_rating_id
`;

async function findById(id) {
  const { rows } = await query(`${SELECT} WHERE s.id = $1`, [id]);
  return rows[0] || null;
}

async function listForChannelInRange(channelId, from, to, { onlyPublished = false } = {}) {
  const where = ['s.channel_id = $1', 's.starts_at >= $2', 's.starts_at < $3'];
  const params = [channelId, from, to];
  if (onlyPublished) where.push('s.is_published = TRUE');
  const { rows } = await query(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY s.starts_at`,
    params
  );
  return rows;
}

async function listInRange(from, to, { onlyPublished = true, channelIds = null } = {}) {
  const where = ['s.starts_at >= $1', 's.starts_at < $2'];
  const params = [from, to];
  if (onlyPublished) where.push('s.is_published = TRUE');
  if (channelIds && channelIds.length) { params.push(channelIds); where.push(`s.channel_id = ANY($${params.length})`); }
  const { rows } = await query(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY s.channel_id, s.starts_at`,
    params
  );
  return rows;
}

async function findConflicts(channelId, startsAt, endsAt, excludeSlotId = null) {
  const params = [channelId, startsAt, endsAt];
  let exclude = '';
  if (excludeSlotId) { params.push(excludeSlotId); exclude = `AND s.id <> $${params.length}`; }
  const { rows } = await query(
    `${SELECT}
     WHERE s.channel_id = $1
       AND s.starts_at < $3
       AND s.ends_at   > $2
       ${exclude}`,
    params
  );
  return rows;
}

async function create({ channelId, programId, startsAt, endsAt, announcement = null, createdBy = null }) {
  const { rows } = await query(
    `INSERT INTO broadcast_slots (channel_id, program_id, starts_at, ends_at, announcement, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [channelId, programId, startsAt, endsAt, announcement, createdBy]
  );
  return findById(rows[0].id);
}

async function update(id, { startsAt, endsAt, announcement }) {
  await query(
    `UPDATE broadcast_slots SET
       starts_at    = COALESCE($2, starts_at),
       ends_at      = COALESCE($3, ends_at),
       announcement = COALESCE($4, announcement),
       updated_at   = NOW()
     WHERE id = $1`,
    [id, startsAt, endsAt, announcement]
  );
  return findById(id);
}

async function publish(slotIds) {
  if (!slotIds || !slotIds.length) return 0;
  const { rowCount } = await query(
    'UPDATE broadcast_slots SET is_published = TRUE, updated_at = NOW() WHERE id = ANY($1)',
    [slotIds]
  );
  return rowCount;
}

async function publishForChannelDate(channelId, dayStart, dayEnd) {
  const { rowCount } = await query(
    `UPDATE broadcast_slots SET is_published = TRUE, updated_at = NOW()
     WHERE channel_id = $1 AND starts_at >= $2 AND starts_at < $3`,
    [channelId, dayStart, dayEnd]
  );
  return rowCount;
}

async function remove(id) {
  await query('DELETE FROM broadcast_slots WHERE id = $1', [id]);
}

module.exports = {
  findById, listForChannelInRange, listInRange, findConflicts,
  create, update, publish, publishForChannelDate, remove,
};
