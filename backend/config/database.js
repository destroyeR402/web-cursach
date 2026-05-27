'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'tv_schedule',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
});

pool.on('error', (err) => {
  console.error('[pg] неожиданная ошибка пула:', err);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS now, version() AS version');
    console.log(`[pg] OK · ${res.rows[0].now} · ${res.rows[0].version.split(',')[0]}`);
    return true;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const ms = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[pg] ${ms}ms · ${text.replace(/\s+/g, ' ').slice(0, 80)}`);
  }
  return res;
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, testConnection, withTransaction };
