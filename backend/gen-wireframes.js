'use strict';

/**
 * Генератор wireframe-макетов для пояснительной записки.
 * Создаёт 14 SVG → PNG для раздела «5. Макеты HTML-страниц».
 *
 * Стиль: light wireframe (как Balsamiq / Figma low-fidelity):
 *   светло-серый фон, чёрные контуры, заштрихованные прямоугольники
 *   на месте картинок, подписи блоков.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'wireframes');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- SVG-хелперы ----------
const W = 1000;
const H = 720;
const PAD = 40;

const SVG_HEADER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8">
      <path d="M0,8 L8,0" stroke="#bbb" stroke-width="0.7"/>
    </pattern>
    <pattern id="hatchSoft" patternUnits="userSpaceOnUse" width="12" height="12">
      <path d="M0,12 L12,0" stroke="#d8d8d8" stroke-width="0.6"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#fafafa"/>
  <style>
    .lbl { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; fill: #555; }
    .lbl-sm { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; fill: #777; }
    .lbl-lg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; fill: #222; font-weight: 600; }
    .lbl-xl { font-family: 'Segoe UI', Arial, sans-serif; font-size: 26px; fill: #111; font-weight: 700; }
    .ttl { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; fill: #999; text-transform: uppercase; letter-spacing: 0.1em; }
    .box { fill: #fff; stroke: #333; stroke-width: 1.5; }
    .fill { fill: url(#hatch); stroke: #555; stroke-width: 1; }
    .fillSoft { fill: url(#hatchSoft); stroke: #aaa; stroke-width: 1; }
    .btn { fill: #f0f0f0; stroke: #333; stroke-width: 1.5; }
    .btn-primary { fill: #333; stroke: #333; }
    .lbl-btn { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #222; font-weight: 600; }
    .lbl-btn-w { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #fff; font-weight: 600; }
    .input { fill: #fff; stroke: #999; stroke-width: 1; }
    .img { fill: url(#hatchSoft); stroke: #aaa; stroke-width: 1; }
    .img line { stroke: #aaa; stroke-width: 0.7; }
    .divider { stroke: #ddd; stroke-width: 1; stroke-dasharray: 3 3; }
    .red { fill: none; stroke: #c33; stroke-width: 1.5; }
    .lbl-red { fill: #c33; }
  </style>
`;

function box(x, y, w, h, opts = {}) {
  const cls = opts.cls || 'box';
  const rx = opts.rx != null ? opts.rx : 3;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
}
function txt(x, y, str, cls = 'lbl') {
  return `<text x="${x}" y="${y}" class="${cls}">${escape(str)}</text>`;
}
function txtC(x, y, str, cls = 'lbl') {
  return `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${escape(str)}</text>`;
}
function img(x, y, w, h, opts = {}) {
  // Прямоугольник с диагональю — стандартный знак «изображение»
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" class="img"/>
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}"/>
    <line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h}"/>
  </g>`;
}
function button(x, y, w, h, label, opts = {}) {
  const cls = opts.primary ? 'btn-primary' : 'btn';
  const tcls = opts.primary ? 'lbl-btn-w' : 'lbl-btn';
  return `${box(x, y, w, h, { cls, rx: 4 })}
    ${txtC(x + w / 2, y + h / 2 + 4, label, tcls)}`;
}
function input(x, y, w, h, placeholder = '') {
  return `${box(x, y, w, h, { cls: 'input' })}
    ${placeholder ? txt(x + 8, y + h / 2 + 4, placeholder, 'lbl-sm') : ''}`;
}
function line(x1, y1, x2, y2, cls = 'divider') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
}
function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- общие части: header / footer ----------
function header(userBox = 'guest') {
  let parts = [
    box(0, 0, W, 50, { cls: 'fillSoft', rx: 0 }),
    txt(PAD, 30, '📺 Расписание ТВ', 'lbl-lg'),
    txt(PAD + 220, 30, 'Расписание', 'lbl'),
    txt(PAD + 320, 30, 'Поиск', 'lbl'),
  ];
  if (userBox === 'guest') {
    parts.push(button(W - 220, 13, 90, 24, 'Войти'));
    parts.push(button(W - 120, 13, 90, 24, 'Регистрация', { primary: true }));
  } else if (userBox === 'client') {
    parts.push(txt(PAD + 400, 30, 'Кабинет', 'lbl'));
    parts.push(txt(PAD + 470, 30, 'Избранное', 'lbl'));
    parts.push(txt(PAD + 555, 30, 'Подписки', 'lbl'));
    parts.push(txt(W - 200, 30, 'ivan @ client', 'lbl'));
    parts.push(button(W - 80, 13, 50, 24, 'Выйти'));
  } else if (userBox === 'editor') {
    parts.push(txt(PAD + 400, 30, 'Сетка', 'lbl'));
    parts.push(txt(PAD + 460, 30, 'Передачи', 'lbl'));
    parts.push(txt(W - 200, 30, 'editor @ editor', 'lbl'));
    parts.push(button(W - 80, 13, 50, 24, 'Выйти'));
  } else if (userBox === 'admin') {
    parts.push(txt(PAD + 400, 30, 'Каналы', 'lbl'));
    parts.push(txt(PAD + 470, 30, 'Передачи', 'lbl'));
    parts.push(txt(PAD + 545, 30, 'Пользователи', 'lbl'));
    parts.push(txt(PAD + 645, 30, 'Журнал', 'lbl'));
    parts.push(txt(W - 200, 30, 'admin @ admin', 'lbl'));
    parts.push(button(W - 80, 13, 50, 24, 'Выйти'));
  }
  return parts.join('\n');
}
function footer() {
  return `${line(0, H - 30, W, H - 30)}
    ${txtC(W / 2, H - 12, '© 2026  ·  Расписание ТВ  ·  Курсовая работа', 'lbl-sm')}`;
}

// ============================================================
// 14 МАКЕТОВ
// ============================================================
const wireframes = {

  '01-home': () => {
    const parts = [SVG_HEADER, header('guest')];
    parts.push(txt(PAD, 95, 'Расписание на 28-05-2026', 'lbl-xl'));
    parts.push(button(W - 320, 75, 28, 26, '‹'));
    parts.push(input(W - 285, 75, 130, 26, '28-05-2026'));
    parts.push(button(W - 150, 75, 28, 26, '›'));
    parts.push(button(W - 115, 75, 75, 26, 'Сегодня'));
    // Поисковая панель
    parts.push(box(PAD, 130, W - 2 * PAD, 64));
    parts.push(txt(PAD + 16, 152, '// Поиск передачи', 'ttl'));
    parts.push(input(PAD + 16, 162, 380, 24, 'Название, ключевое слово…'));
    parts.push(input(PAD + 410, 162, 200, 24, 'Все жанры ▾'));
    parts.push(input(PAD + 625, 162, 140, 24, 'дд.мм.гггг'));
    parts.push(button(W - PAD - 130, 162, 110, 24, 'Найти', { primary: true }));
    // Управление
    parts.push(txt(PAD, 222, '☐ только избранные каналы', 'lbl'));
    parts.push(button(W - 260, 207, 110, 22, 'Развернуть все'));
    parts.push(button(W - 140, 207, 100, 22, 'Свернуть'));
    parts.push(line(PAD, 240, W - PAD, 240));
    // 5 каналов (свёрнутые details)
    for (let i = 0; i < 5; i++) {
      const y = 255 + i * 65;
      parts.push(box(PAD, y, W - 2 * PAD, 55));
      parts.push(img(PAD + 14, y + 9, 36, 36));
      parts.push(txt(PAD + 65, y + 22, `Канал ${i + 1}`, 'lbl-lg'));
      parts.push(txt(PAD + 65, y + 42, 'эфирный · /channel', 'ttl'));
      if (i === 0) {
        parts.push(txt(W - 460, y + 33, '● Сейчас: Утренние новости', 'lbl-red'));
      }
      parts.push(`<text x="${W - 95}" y="${y + 33}" class="lbl-sm" text-anchor="end">${10 + i * 2} передач</text>`);
      parts.push(txtC(W - 65, y + 35, '▾', 'lbl-lg'));
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '02-search': () => {
    const parts = [SVG_HEADER, header('guest')];
    parts.push(txt(PAD, 100, 'Поиск передач', 'lbl-xl'));
    parts.push(txt(PAD, 124, 'Используйте любую комбинацию фильтров — они работают независимо', 'lbl-sm'));
    // Форма поиска
    parts.push(box(PAD, 150, W - 2 * PAD, 130, { cls: 'fillSoft' }));
    parts.push(txt(PAD + 16, 175, '// Название передачи', 'ttl'));
    parts.push(input(PAD + 16, 185, W - 2 * PAD - 32, 30, 'например, «новости» или «футбол»'));
    parts.push(txt(PAD + 16, 235, '// Жанр', 'ttl'));
    parts.push(input(PAD + 16, 245, 280, 28, '— любой —'));
    parts.push(txt(PAD + 310, 235, '// Дата эфира', 'ttl'));
    parts.push(input(PAD + 310, 245, 200, 28, 'дд.мм.гггг'));
    parts.push(button(W - 250, 245, 110, 28, '🔍 Найти', { primary: true }));
    parts.push(button(W - 130, 245, 90, 28, 'Сбросить'));
    // Результаты — карточки
    parts.push(txt(PAD, 310, 'Найдено: 12 передач', 'lbl-lg'));
    parts.push(line(PAD, 322, W - PAD, 322));
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = PAD + col * ((W - 2 * PAD) / 3);
        const y = 340 + row * 160;
        const cw = (W - 2 * PAD) / 3 - 14;
        parts.push(box(x, y, cw, 145));
        parts.push(img(x + 10, y + 10, 70, 90));
        parts.push(txt(x + 90, y + 30, 'Название передачи', 'lbl'));
        parts.push(txt(x + 90, y + 50, '◢ Жанр  ◢ 12+', 'lbl-sm'));
        parts.push(txt(x + 90, y + 70, '60 мин', 'lbl-sm'));
        parts.push(txt(x + 10, y + 120, 'Каналы: Первый, Россия-1', 'lbl-sm'));
      }
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '03-login': () => {
    const parts = [SVG_HEADER, header('guest')];
    // карточка формы по центру
    const fx = (W - 380) / 2;
    const fy = 150;
    parts.push(box(fx, fy, 380, 360));
    parts.push(txtC(fx + 190, fy + 50, 'Вход в систему', 'lbl-xl'));
    parts.push(line(fx + 60, fy + 70, fx + 320, fy + 70));
    parts.push(txt(fx + 30, fy + 110, 'Email или логин', 'lbl-sm'));
    parts.push(input(fx + 30, fy + 120, 320, 38));
    parts.push(txt(fx + 30, fy + 180, 'Пароль', 'lbl-sm'));
    parts.push(input(fx + 30, fy + 190, 320, 38, '••••••••'));
    parts.push(button(fx + 30, fy + 250, 320, 40, 'Войти', { primary: true }));
    parts.push(txtC(fx + 190, fy + 320, 'Нет аккаунта? Зарегистрируйтесь', 'lbl-sm'));
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '04-register': () => {
    const parts = [SVG_HEADER, header('guest')];
    const fx = (W - 420) / 2;
    const fy = 100;
    parts.push(box(fx, fy, 420, 530));
    parts.push(txtC(fx + 210, fy + 50, 'Регистрация', 'lbl-xl'));
    parts.push(line(fx + 60, fy + 70, fx + 360, fy + 70));
    const fields = [
      ['Email', 'name@example.com'],
      ['Логин (3–32 симв.)', 'username'],
      ['Отображаемое имя', 'Иван Петров'],
      ['Пароль (минимум 6 символов)', '••••••••'],
    ];
    fields.forEach((f, i) => {
      const yy = fy + 100 + i * 80;
      parts.push(txt(fx + 30, yy, f[0], 'lbl-sm'));
      parts.push(input(fx + 30, yy + 10, 360, 36, f[1]));
    });
    parts.push(button(fx + 30, fy + 440, 360, 42, 'Зарегистрироваться', { primary: true }));
    parts.push(txtC(fx + 210, fy + 510, 'Уже есть аккаунт? Войти', 'lbl-sm'));
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '05-profile': () => {
    const parts = [SVG_HEADER, header('client')];
    parts.push(txt(PAD, 100, 'Профиль', 'lbl-xl'));
    // карточка профиля
    parts.push(box(PAD, 130, W - 2 * PAD, 130));
    // аватар (круг)
    parts.push(`<circle cx="${PAD + 70}" cy="195" r="48" class="img"/>`);
    parts.push(`<line x1="${PAD + 28}" y1="153" x2="${PAD + 112}" y2="237" class="img"/>`);
    parts.push(`<line x1="${PAD + 112}" y1="153" x2="${PAD + 28}" y2="237" class="img"/>`);
    // данные
    const fields = ['Email:  ivan@tv.local', 'Логин:  ivan', 'Имя:  Иван Петров', 'Роль:  client', 'Создан:  28.05.2026'];
    fields.forEach((f, i) => {
      parts.push(txt(PAD + 150, 158 + i * 22, f, 'lbl'));
    });
    // форма обновления
    parts.push(txt(PAD, 295, 'Обновить данные', 'lbl-lg'));
    parts.push(line(PAD, 305, W - PAD, 305));
    parts.push(txt(PAD, 335, 'Отображаемое имя', 'lbl-sm'));
    parts.push(input(PAD, 345, W - 2 * PAD, 36, 'Иван Петров'));
    parts.push(txt(PAD, 405, 'Аватар (PNG/JPEG/WEBP, до 5 МБ)', 'lbl-sm'));
    parts.push(box(PAD, 415, W - 2 * PAD, 50));
    parts.push(button(PAD + 12, 425, 130, 30, 'Выбрать файл'));
    parts.push(txt(PAD + 155, 444, '… файл не выбран', 'lbl-sm'));
    parts.push(button(PAD, 490, 200, 42, 'Сохранить', { primary: true }));
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '06-client-dashboard': () => {
    const parts = [SVG_HEADER, header('client')];
    parts.push(txt(PAD, 100, 'Здравствуйте, Иван Петров', 'lbl-xl'));
    // левая колонка — сегодня в эфире
    parts.push(txt(PAD, 145, 'Сегодня на ваших каналах', 'lbl-lg'));
    parts.push(line(PAD, 158, PAD + 540, 158));
    for (let i = 0; i < 7; i++) {
      const y = 175 + i * 50;
      parts.push(txt(PAD + 5, y + 20, `${(6 + i).toString().padStart(2, '0')}:00`, 'lbl-sm'));
      parts.push(txt(PAD + 70, y + 12, `Передача ${i + 1}`, 'lbl'));
      parts.push(txt(PAD + 70, y + 30, 'Первый канал', 'lbl-sm'));
      if (i === 1) parts.push(txt(PAD + 380, y + 22, '● В эфире', 'lbl-red'));
      parts.push(txt(PAD + 510, y + 22, '12+', 'lbl-sm'));
      parts.push(line(PAD, y + 42, PAD + 540, y + 42));
    }
    // правая колонка — каналы
    const rx = PAD + 580;
    parts.push(txt(rx, 145, 'Все каналы', 'lbl-lg'));
    parts.push(line(rx, 158, W - PAD, 158));
    for (let i = 0; i < 5; i++) {
      const y = 175 + i * 60;
      parts.push(txt(rx + 5, y + 28, `0${i + 1}`, 'lbl-lg'));
      parts.push(txt(rx + 50, y + 22, `Канал ${i + 1}`, 'lbl'));
      parts.push(txt(rx + 50, y + 40, 'эфирный', 'ttl'));
      parts.push(button(rx + 220, y + 14, 90, 26, 'Расписание'));
      parts.push(button(rx + 314, y + 14, 90, 26, i < 2 ? '♥ В избр.' : '♡ Избр.', { primary: i < 2 }));
      parts.push(line(rx, y + 52, W - PAD, y + 52));
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '07-favorites': () => {
    const parts = [SVG_HEADER, header('client')];
    parts.push(txt(PAD, 100, 'В избранном', 'lbl-xl'));
    parts.push(txt(PAD, 125, '3 каналов · 5 передач', 'ttl'));
    // секция I — каналы
    parts.push(txt(PAD, 165, 'I  Любимые каналы', 'lbl-lg'));
    parts.push(input(W - 360, 152, 200, 26, 'Поиск канала…'));
    parts.push(input(W - 150, 152, 110, 26, 'Сорт ▾'));
    parts.push(line(PAD, 180, W - PAD, 180));
    for (let i = 0; i < 3; i++) {
      const x = PAD + i * 305;
      const y = 200;
      parts.push(box(x, y, 290, 90));
      parts.push(txt(x + 14, y + 50, `0${i + 1}`, 'lbl-xl'));
      parts.push(txt(x + 70, y + 30, `Канал ${i + 1}`, 'lbl-lg'));
      parts.push(txt(x + 70, y + 50, 'эфирный', 'ttl'));
      parts.push(button(x + 70, y + 60, 90, 22, 'Открыть'));
      parts.push(button(x + 165, y + 60, 90, 22, 'Убрать'));
    }
    // секция II — передачи
    parts.push(txt(PAD, 340, 'II  Любимые передачи', 'lbl-lg'));
    parts.push(input(W - 360, 327, 200, 26, 'Поиск передачи…'));
    parts.push(input(W - 150, 327, 110, 26, 'Сорт ▾'));
    parts.push(line(PAD, 355, W - PAD, 355));
    for (let i = 0; i < 4; i++) {
      const x = PAD + i * 230;
      const y = 375;
      parts.push(box(x, y, 215, 200));
      parts.push(img(x + 10, y + 10, 195, 110));
      parts.push(txt(x + 12, y + 140, 'Название', 'lbl'));
      parts.push(txt(x + 12, y + 156, '◢ Жанр  ◢ 12+', 'lbl-sm'));
      parts.push(button(x + 12, y + 170, 95, 22, '★ В избр.'));
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '08-subscriptions': () => {
    const parts = [SVG_HEADER, header('client')];
    parts.push(txt(PAD, 100, 'Подписки и уведомления', 'lbl-xl'));
    parts.push(txt(PAD, 124, 'Получайте email-уведомления о публикации новой сетки на выбранных каналах', 'lbl-sm'));
    // форма добавления
    parts.push(box(PAD, 150, W - 2 * PAD, 175));
    parts.push(txt(PAD + 16, 175, '+ Подписаться на канал', 'lbl-lg'));
    parts.push(line(PAD + 16, 188, W - PAD - 16, 188));
    parts.push(txt(PAD + 16, 215, 'Канал', 'lbl-sm'));
    parts.push(input(PAD + 16, 224, 380, 32, 'Первый канал ▾'));
    parts.push(box(PAD + 410, 224, 110, 32));
    parts.push(txt(PAD + 422, 244, '☑ 📧 Email', 'lbl-sm'));
    parts.push(box(PAD + 528, 224, 110, 32));
    parts.push(txt(PAD + 540, 244, '☐ 🔔 Push', 'lbl-sm'));
    parts.push(button(W - PAD - 160, 224, 140, 32, 'Подписаться', { primary: true }));
    // активные подписки
    parts.push(txt(PAD, 360, 'Активные подписки (3)', 'lbl-lg'));
    parts.push(line(PAD, 375, W - PAD, 375));
    for (let i = 0; i < 3; i++) {
      const y = 390 + i * 80;
      parts.push(box(PAD + 8, y + 10, 56, 56));
      parts.push(`<g><line x1="${PAD + 8}" y1="${y + 10}" x2="${PAD + 64}" y2="${y + 66}" class="img"/><line x1="${PAD + 64}" y1="${y + 10}" x2="${PAD + 8}" y2="${y + 66}" class="img"/></g>`);
      parts.push(txt(PAD + 85, y + 38, `Канал ${i + 1}`, 'lbl-lg'));
      parts.push(txt(PAD + 85, y + 58, '◢ эфирный', 'lbl-sm'));
      parts.push(txt(W - 280, y + 38, '📧 EMAIL    🔔 PUSH', 'lbl-sm'));
      parts.push(txt(W - 280, y + 55, 'с 28.05.2026', 'lbl-sm'));
      parts.push(button(W - 130, y + 28, 100, 28, 'Отписаться'));
      parts.push(line(PAD, y + 78, W - PAD, y + 78));
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '09-grid-builder': () => {
    const parts = [SVG_HEADER, header('editor')];
    parts.push(txt(PAD, 100, 'Программирование эфира', 'lbl-xl'));
    // панель управления
    parts.push(input(PAD, 130, 200, 32, 'Первый канал ▾'));
    parts.push(button(PAD + 210, 130, 26, 32, '‹'));
    parts.push(input(PAD + 240, 130, 130, 32, '28.05.2026'));
    parts.push(button(PAD + 374, 130, 26, 32, '›'));
    parts.push(button(PAD + 410, 130, 90, 32, 'Сегодня'));
    parts.push(button(W - PAD - 170, 130, 170, 32, 'Опубликовать', { primary: true }));
    // двухколоночная сетка
    const lx = PAD; const ly = 180;
    parts.push(box(lx, ly, 230, H - ly - 60));
    parts.push(txt(lx + 12, ly + 22, '// Передачи', 'ttl'));
    parts.push(input(lx + 12, ly + 35, 206, 28, 'Поиск…'));
    for (let i = 0; i < 8; i++) {
      const y = ly + 75 + i * 50;
      parts.push(box(lx + 12, y, 206, 42, { cls: 'fillSoft' }));
      parts.push(txt(lx + 22, y + 20, `Передача ${i + 1}`, 'lbl'));
      parts.push(txt(lx + 22, y + 35, `${30 + i * 15} мин`, 'lbl-sm'));
    }
    // правая часть — таймлайн
    const rx = PAD + 250; const rw = W - PAD - rx;
    parts.push(box(rx, ly, rw, H - ly - 60));
    parts.push(txt(rx + 12, ly + 22, '// Сетка на 28.05.2026 — Первый канал', 'ttl'));
    for (let h = 0; h < 9; h++) {
      const y = ly + 50 + h * 48;
      parts.push(line(rx, y, rx + rw, y));
      parts.push(txt(rx + 8, y + 16, `${(6 + h).toString().padStart(2, '0')}:00`, 'lbl-sm'));
      if (h < 7) {
        parts.push(box(rx + 60, y + 4, rw - 80, 40, { cls: 'btn-primary', rx: 4 }));
        parts.push(txt(rx + 75, y + 21, `${(6 + h).toString().padStart(2, '0')}:00–${(6 + h + 1).toString().padStart(2, '0')}:00`, 'lbl-btn-w'));
        parts.push(txt(rx + 160, y + 21, `Передача ${h + 1}`, 'lbl-btn-w'));
        parts.push(txt(rx + rw - 28, y + 21, '×', 'lbl-btn-w'));
      }
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '10-programs-manage': () => {
    const parts = [SVG_HEADER, header('editor')];
    parts.push(txt(PAD, 100, 'Управление передачами', 'lbl-xl'));
    parts.push(txt(PAD, 124, 'Всего передач: 35', 'ttl'));
    // форма (свёрнута)
    parts.push(box(PAD, 150, W - 2 * PAD, 36));
    parts.push(txt(PAD + 16, 172, '▸  + Добавить передачу', 'lbl'));
    // поиск
    parts.push(input(PAD, 205, W - 2 * PAD, 32, 'Поиск по названию / жанру…'));
    // таблица
    const tx = PAD; const ty = 255;
    parts.push(box(tx, ty, W - 2 * PAD, 32, { cls: 'fillSoft' }));
    const cols = ['Постер', 'Название', 'Жанр', 'Возраст', 'Длит.', 'Описание', ''];
    const colW = [70, 200, 130, 80, 80, 280, 80];
    let cx = tx + 14;
    cols.forEach((c, i) => {
      parts.push(txt(cx, ty + 21, c, 'ttl'));
      cx += colW[i];
    });
    for (let i = 0; i < 7; i++) {
      const y = ty + 32 + i * 56;
      parts.push(line(tx, y, tx + W - 2 * PAD, y));
      parts.push(img(tx + 12, y + 6, 42, 42));
      parts.push(txt(tx + 84, y + 28, `Название передачи ${i + 1}`, 'lbl'));
      parts.push(txt(tx + 84 + 200, y + 28, 'Новости', 'lbl-sm'));
      parts.push(txt(tx + 84 + 330, y + 28, '12+', 'lbl-sm'));
      parts.push(txt(tx + 84 + 410, y + 28, '60 мин', 'lbl-sm'));
      parts.push(txt(tx + 84 + 490, y + 28, '...', 'lbl-sm'));
      parts.push(button(tx + W - 2 * PAD - 70, y + 14, 28, 28, '✎'));
      parts.push(button(tx + W - 2 * PAD - 36, y + 14, 28, 28, '×'));
    }
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '11-channels-manage': () => {
    const parts = [SVG_HEADER, header('admin')];
    parts.push(txt(PAD, 100, 'Управление каналами', 'lbl-xl'));
    parts.push(txt(PAD, 124, 'Всего каналов: 5', 'ttl'));
    parts.push(box(PAD, 150, W - 2 * PAD, 36));
    parts.push(txt(PAD + 16, 172, '▸  + Добавить канал', 'lbl'));
    // таблица
    const tx = PAD; const ty = 215;
    parts.push(box(tx, ty, W - 2 * PAD, 32, { cls: 'fillSoft' }));
    const cols = ['Лого', 'Название', 'Slug', 'Категория', 'Активен', 'Описание', ''];
    let cx = tx + 14;
    [70, 200, 150, 130, 80, 200, 80].forEach((w, i) => {
      parts.push(txt(cx, ty + 21, cols[i], 'ttl'));
      cx += w;
    });
    const channels = [
      ['Первый канал', '/channel-one', 'эфирный', '✔'],
      ['Россия-1', '/rossiya-1', 'эфирный', '✔'],
      ['НТВ', '/ntv', 'эфирный', '✔'],
      ['Матч ТВ', '/match-tv', 'спорт', '✔'],
      ['Карусель', '/carousel', 'детский', '✔'],
    ];
    channels.forEach((ch, i) => {
      const y = ty + 32 + i * 60;
      parts.push(line(tx, y, tx + W - 2 * PAD, y));
      parts.push(img(tx + 12, y + 8, 46, 46));
      parts.push(txt(tx + 84, y + 30, ch[0], 'lbl'));
      parts.push(txt(tx + 84 + 200, y + 30, ch[1], 'lbl-sm'));
      parts.push(txt(tx + 84 + 350, y + 30, ch[2], 'lbl-sm'));
      parts.push(txt(tx + 84 + 480, y + 30, ch[3], 'lbl-sm'));
      parts.push(txt(tx + 84 + 560, y + 30, 'Главный …', 'lbl-sm'));
      parts.push(button(tx + W - 2 * PAD - 70, y + 18, 28, 28, '✎'));
      parts.push(button(tx + W - 2 * PAD - 36, y + 18, 28, 28, '×'));
    });
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '12-users-manage': () => {
    const parts = [SVG_HEADER, header('admin')];
    parts.push(txt(PAD, 100, 'Пользователи', 'lbl-xl'));
    // плитка статистики
    const stats = [['6', 'ВСЕГО'], ['4', 'КЛИЕНТОВ'], ['1', 'РЕДАКТОРОВ'], ['1', 'АДМИНОВ']];
    stats.forEach((s, i) => {
      const x = PAD + i * 225;
      parts.push(box(x, 135, 210, 70));
      parts.push(txt(x + 18, 175, s[0], 'lbl-xl'));
      parts.push(txt(x + 18, 195, s[1], 'ttl'));
    });
    // фильтры
    parts.push(input(PAD, 230, 380, 32, 'Email, логин, имя…'));
    parts.push(input(PAD + 395, 230, 200, 32, 'Все роли ▾'));
    parts.push(input(PAD + 610, 230, 180, 32, 'Статус: все ▾'));
    // таблица
    const tx = PAD; const ty = 285;
    parts.push(box(tx, ty, W - 2 * PAD, 32, { cls: 'fillSoft' }));
    ['ID', 'Email · логин', 'Имя', 'Роль', 'Активен', 'Создан', 'Канал'].forEach((c, i) => {
      const w = [60, 280, 180, 120, 90, 100, 100];
      let cx = tx + 14; for (let j = 0; j < i; j++) cx += w[j];
      parts.push(txt(cx, ty + 21, c, 'ttl'));
    });
    const users = [
      ['1', 'admin@tv.local', 'Администратор', 'ADMIN'],
      ['2', 'editor@tv.local', 'Редактор сетки', 'EDITOR'],
      ['3', 'client@tv.local', 'Тестовый клиент', 'CLIENT'],
      ['4', 'ivan@tv.local', 'Иван Петров', 'CLIENT'],
      ['5', 'maria@tv.local', 'Мария Сидорова', 'CLIENT'],
    ];
    users.forEach((u, i) => {
      const y = ty + 32 + i * 48;
      parts.push(line(tx, y, tx + W - 2 * PAD, y));
      parts.push(txt(tx + 14, y + 28, u[0], 'lbl'));
      parts.push(txt(tx + 74, y + 22, u[1], 'lbl'));
      parts.push(txt(tx + 74, y + 36, `@${u[1].split('@')[0]}`, 'lbl-sm'));
      parts.push(txt(tx + 74 + 280, y + 28, u[2], 'lbl'));
      parts.push(input(tx + 74 + 460, y + 12, 100, 26, u[3]));
      parts.push(txt(tx + 74 + 580, y + 28, '☑ ON', 'lbl-sm'));
      parts.push(txt(tx + 74 + 670, y + 28, '28.05.26', 'lbl-sm'));
    });
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '13-audit-logs': () => {
    const parts = [SVG_HEADER, header('admin')];
    parts.push(txt(PAD, 100, 'Журнал аудита', 'lbl-xl'));
    parts.push(button(W - 180, 90, 140, 32, '⬇ Экспорт CSV', { primary: true }));
    // таблица
    const tx = PAD; const ty = 150;
    parts.push(box(tx, ty, W - 2 * PAD, 32, { cls: 'fillSoft' }));
    ['Дата / время', 'Пользователь', 'Действие', 'Сущность', 'ID', 'IP'].forEach((c, i) => {
      const w = [160, 160, 250, 130, 80, 130];
      let cx = tx + 14; for (let j = 0; j < i; j++) cx += w[j];
      parts.push(txt(cx, ty + 21, c, 'ttl'));
    });
    const logs = [
      ['28.05.26 04:11:42', 'admin', 'user.login.ok', '—', '—', '127.0.0.1'],
      ['28.05.26 04:09:13', 'editor', 'schedule.publish', 'channel', '1', '127.0.0.1'],
      ['28.05.26 04:08:55', 'editor', 'program.create', 'program', '36', '127.0.0.1'],
      ['28.05.26 04:05:22', 'ivan', 'user.login.fail', '—', '—', '127.0.0.1'],
      ['28.05.26 04:04:18', 'ivan', 'user.login.ok', '—', '—', '127.0.0.1'],
      ['28.05.26 03:58:33', 'admin', 'admin.change_role', 'user', '5', '127.0.0.1'],
      ['28.05.26 03:55:01', 'admin', 'admin.toggle_active', 'user', '5', '127.0.0.1'],
      ['28.05.26 03:50:47', 'maria', 'user.register', '—', '—', '127.0.0.1'],
      ['28.05.26 03:42:09', 'editor', 'channel.update', 'channel', '2', '127.0.0.1'],
    ];
    logs.forEach((l, i) => {
      const y = ty + 32 + i * 42;
      parts.push(line(tx, y, tx + W - 2 * PAD, y));
      l.forEach((cell, j) => {
        const w = [160, 160, 250, 130, 80, 130];
        let cx = tx + 14; for (let k = 0; k < j; k++) cx += w[k];
        parts.push(txt(cx, y + 26, cell, 'lbl-sm'));
      });
    });
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },

  '14-error': () => {
    const parts = [SVG_HEADER, header('guest')];
    // центральный блок
    parts.push(box((W - 600) / 2, 180, 600, 320));
    parts.push(txtC(W / 2, 280, '404', 'lbl-xl').replace('font-size: 26px', 'font-size: 96px'));
    // нарисую большую цифру вручную
    parts.push(`<text x="${W / 2}" y="320" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="120" font-weight="800" fill="#222">404</text>`);
    parts.push(txtC(W / 2, 380, 'Страница не найдена', 'lbl-lg'));
    parts.push(txtC(W / 2, 408, 'Запрошенный маршрут GET /nonexistent-page не найден', 'lbl-sm'));
    parts.push(button((W - 200) / 2, 440, 200, 44, 'На главную', { primary: true }));
    parts.push(footer());
    parts.push('</svg>');
    return parts.join('\n');
  },
};

// ============================================================
// РЕНДЕР В PNG
// ============================================================
async function main() {
  console.log('[wireframes] подготавливаю файлы...');
  // сохраняем все SVG в файлы
  const items = Object.entries(wireframes);
  const tmpDir = path.join(OUT_DIR, '_svg');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  items.forEach(([name, gen]) => {
    const svg = gen();
    fs.writeFileSync(path.join(tmpDir, `${name}.svg`), svg, 'utf8');
  });
  console.log(`[wireframes] SVG: ${items.length} файлов в ${tmpDir}`);

  console.log('[wireframes] рендерю PNG через puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 720, deviceScaleFactor: 2 });

  for (const [name] of items) {
    const svgPath = path.join(tmpDir, `${name}.svg`);
    const url = 'file:///' + svgPath.replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle0' });
    const outPath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, omitBackground: false });
    const sz = fs.statSync(outPath).size;
    console.log(`  · ${name}.png  (${(sz / 1024).toFixed(0)} КБ)`);
  }

  await browser.close();
  console.log('\n[wireframes] ✅ ГОТОВО');
  console.log(`[wireframes] PNG: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
