'use strict';

/**
 * Автоматическая генерация скриншотов всех ключевых страниц.
 * Логинится разными ролями (admin/editor/client) и сохраняет PNG-файлы
 * в docs/screenshots/.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

async function login(page, identifier, password) {
  // получаем cookies через POST /auth/login (JSON), сервер ставит сессию
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(async (id, pw) => {
    const r = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: id, password: pw }),
    });
    return r.status;
  }, identifier, password);
  await new Promise(r => setTimeout(r, 200));
}

async function logout(page) {
  await page.evaluate(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  });
  // также чистим куки
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
}

async function shot(page, url, fileName, opts = {}) {
  console.log(`  · ${fileName.padEnd(40)} ← ${url}`);
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, opts.delay || 600));
  if (opts.scrollTo) await page.evaluate((y) => window.scrollTo(0, y), opts.scrollTo);
  if (opts.click) {
    try {
      await page.click(opts.click);
      await new Promise(r => setTimeout(r, 300));
    } catch (_) {}
  }
  if (opts.eval) await page.evaluate(opts.eval);
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    fullPage: opts.fullPage !== false,
  });
}

async function main() {
  console.log('[shots] запускаю Chromium...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ru-RU'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

  try {
    // === ГОСТЕВЫЕ СТРАНИЦЫ ===
    console.log('\n[gostevye]');
    await shot(page, '/', '01-home-guest.png');
    await shot(page, '/search', '02-search-empty.png', { fullPage: false });
    await shot(page, '/search?q=%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8', '03-search-by-query.png');
    await shot(page, '/search?genreId=8', '04-search-by-genre.png');
    await shot(page, '/search?date=2026-05-28', '05-search-by-date.png');
    await shot(page, '/auth/login', '06-login.png', { fullPage: false });
    await shot(page, '/auth/register', '07-register.png', { fullPage: false });

    // === КЛИЕНТ ===
    console.log('\n[client / ivan]');
    await login(page, 'ivan@tv.local', 'Password123');
    await shot(page, '/client/dashboard', '08-client-dashboard.png');
    await shot(page, '/client/favorites', '09-client-favorites.png');
    await shot(page, '/client/subscriptions', '10-client-subscriptions.png');
    await shot(page, '/auth/profile', '11-client-profile.png', { fullPage: false });
    await shot(page, '/', '12-home-as-client.png');
    await logout(page);

    // === РЕДАКТОР ===
    console.log('\n[editor]');
    await login(page, 'editor@tv.local', 'Password123');
    await shot(page, '/admin/grid', '13-editor-grid.png');
    await shot(page, '/admin/programs', '14-editor-programs.png');
    await logout(page);

    // === АДМИНИСТРАТОР ===
    console.log('\n[admin]');
    await login(page, 'admin@tv.local', 'Password123');
    await shot(page, '/admin/users', '15-admin-users.png');
    await shot(page, '/admin/channels', '16-admin-channels.png');
    await shot(page, '/admin/programs', '17-admin-programs.png');
    await shot(page, '/admin/logs', '18-admin-logs.png');
    await shot(page, '/admin/grid', '19-admin-grid.png');
    await logout(page);

    // === Страница ошибки ===
    console.log('\n[errors]');
    await shot(page, '/nonexistent-page-404', '20-error-404.png', { fullPage: false });

    console.log('\n[shots] ✅ ГОТОВО');
    console.log(`[shots] Файлы сохранены в: ${OUT_DIR}`);
    const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort();
    console.log(`[shots] Всего: ${files.length} файлов`);
    files.forEach(f => {
      const sz = fs.statSync(path.join(OUT_DIR, f)).size;
      console.log(`         · ${f}  (${(sz / 1024).toFixed(0)} КБ)`);
    });
  } catch (err) {
    console.error('[shots] ОШИБКА:', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
}

main();
