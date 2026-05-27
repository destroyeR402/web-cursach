'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function run() {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`[migrate] применяю ${sqlPath}`);
  await pool.query(sql);
  console.log('[migrate] OK');
  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] ОШИБКА:', err.message);
  process.exit(1);
});
