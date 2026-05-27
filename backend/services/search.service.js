'use strict';

const { query } = require('../config/database');
const { startOfDay, addDays } = require('../utils/date.util');

/**
 * Универсальный поиск.
 * Параметры независимы — можно искать любую комбинацию или вообще без них.
 *
 *   q        — подстрока в названии передачи (case-insensitive)
 *   genreId  — фильтр по жанру
 *   ageMax   — макс. возрастной рейтинг (показывать передачи ≤ ageMax)
 *   date     — конкретная дата (YYYY-MM-DD) → ищем по слотам, а не по программам
 *
 * Возвращает { mode, items, count }:
 *   mode === 'slots'    — найдены слоты на эту дату (передачи в эфире)
 *                         items = [{ slot_id, starts_at, channel_name, program_title, ... }]
 *   mode === 'programs' — без даты, найдены передачи
 *                         items = [{ id, title, description, genre_name, ... }]
 */
async function searchPrograms({ q = '', genreId = null, ageMax = null, date = null } = {}) {
  q = (q || '').trim();
  genreId = genreId ? parseInt(genreId, 10) : null;
  ageMax = ageMax !== null && ageMax !== undefined && ageMax !== '' ? parseInt(ageMax, 10) : null;

  if (date) {
    const day = new Date(date);
    if (Number.isNaN(day.getTime())) return { mode: 'slots', items: [], count: 0 };
    const from = startOfDay(day);
    const to = addDays(from, 1);

    const params = [from, to];
    const where = ['s.is_published = TRUE', 's.starts_at >= $1', 's.starts_at < $2'];
    if (q)       { params.push(`%${q}%`);  where.push(`p.title ILIKE $${params.length}`); }
    if (genreId) { params.push(genreId);   where.push(`p.genre_id = $${params.length}`); }
    if (ageMax !== null) { params.push(ageMax); where.push(`(ar.min_age IS NULL OR ar.min_age <= $${params.length})`); }

    const sql = `
      SELECT s.id AS slot_id, s.starts_at, s.ends_at,
             s.channel_id, c.name AS channel_name, c.slug AS channel_slug, c.logo_path AS channel_logo,
             p.id AS program_id, p.title, p.description, p.poster_path, p.duration_min,
             g.name AS genre_name, g.code AS genre_code,
             ar.code AS age_code, ar.min_age
      FROM broadcast_slots s
      JOIN programs p ON p.id = s.program_id
      JOIN channels c ON c.id = s.channel_id
      LEFT JOIN genres g       ON g.id  = p.genre_id
      LEFT JOIN age_ratings ar ON ar.id = p.age_rating_id
      WHERE ${where.join(' AND ')}
      ORDER BY s.starts_at, c.name
      LIMIT 500
    `;
    const { rows } = await query(sql, params);
    return { mode: 'slots', items: rows, count: rows.length };
  }

  // === Без даты — поиск по справочнику передач ===
  const params = [];
  const where = ['p.is_archived = FALSE'];
  if (q)       { params.push(`%${q}%`); where.push(`p.title ILIKE $${params.length}`); }
  if (genreId) { params.push(genreId);  where.push(`p.genre_id = $${params.length}`); }
  if (ageMax !== null) { params.push(ageMax); where.push(`(ar.min_age IS NULL OR ar.min_age <= $${params.length})`); }

  const sql = `
    SELECT p.id, p.title, p.description, p.poster_path, p.duration_min,
           p.genre_id, p.age_rating_id,
           g.name AS genre_name, g.code AS genre_code,
           ar.code AS age_code, ar.min_age,
           (SELECT COUNT(*)::int FROM broadcast_slots s
              WHERE s.program_id = p.id AND s.is_published = TRUE AND s.starts_at >= NOW() - INTERVAL '14 days') AS recent_slot_count,
           (SELECT MIN(s.starts_at) FROM broadcast_slots s
              WHERE s.program_id = p.id AND s.is_published = TRUE AND s.starts_at >= NOW()) AS next_show_at,
           (
             SELECT json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logo_path', c.logo_path))
             FROM broadcast_slots s
             JOIN channels c ON c.id = s.channel_id
             WHERE s.program_id = p.id AND s.is_published = TRUE
           ) AS channels
    FROM programs p
    LEFT JOIN genres g       ON g.id  = p.genre_id
    LEFT JOIN age_ratings ar ON ar.id = p.age_rating_id
    WHERE ${where.join(' AND ')}
    ORDER BY p.title
    LIMIT 200
  `;
  const { rows } = await query(sql, params);
  // нормализуем channels: null → []
  rows.forEach((r) => { if (!r.channels) r.channels = []; });
  return { mode: 'programs', items: rows, count: rows.length };
}

module.exports = { searchPrograms };
