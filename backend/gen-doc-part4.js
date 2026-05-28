'use strict';

const fs = require('fs');
const path = require('path');
const m = require('./gen-doc');
const { H1, H2, P, BR, BRS, CONTENT_W, FONT } = m;
const { Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType, AlignmentType } = require('docx');

// ============================================================
// 8. ПОЛНЫЙ ЛИСТИНГ ПО
// ============================================================
const FILES = [
  // root
  'backend/.env.example',
  'backend/package.json',
  'backend/server.js',
  // config
  'backend/config/database.js',
  'backend/config/multer.config.js',
  'backend/config/jwt.config.js',
  // database
  'backend/database/schema.sql',
  'backend/database/migrate.js',
  'backend/database/seed.js',
  // middlewares
  'backend/middlewares/auth.middleware.js',
  'backend/middlewares/rbac.middleware.js',
  'backend/middlewares/validation.middleware.js',
  'backend/middlewares/file.middleware.js',
  'backend/middlewares/error.middleware.js',
  'backend/middlewares/logger.middleware.js',
  // utils
  'backend/utils/password.util.js',
  'backend/utils/response.util.js',
  'backend/utils/date.util.js',
  'backend/utils/slug.util.js',
  // models
  'backend/models/User.js',
  'backend/models/Role.js',
  'backend/models/Channel.js',
  'backend/models/Program.js',
  'backend/models/Genre.js',
  'backend/models/AgeRating.js',
  'backend/models/BroadcastSlot.js',
  'backend/models/Favorite.js',
  'backend/models/Subscription.js',
  'backend/models/AuditLog.js',
  // services
  'backend/services/auth.service.js',
  'backend/services/rbac.service.js',
  'backend/services/schedule.service.js',
  'backend/services/search.service.js',
  'backend/services/file.service.js',
  'backend/services/notification.service.js',
  // controllers
  'backend/controllers/auth.controller.js',
  'backend/controllers/guest.controller.js',
  'backend/controllers/channel.controller.js',
  'backend/controllers/program.controller.js',
  'backend/controllers/schedule.controller.js',
  'backend/controllers/client.controller.js',
  'backend/controllers/admin.controller.js',
  // routes
  'backend/routes/auth.routes.js',
  'backend/routes/guest.routes.js',
  'backend/routes/channel.routes.js',
  'backend/routes/program.routes.js',
  'backend/routes/schedule.routes.js',
  'backend/routes/client.routes.js',
  'backend/routes/admin.routes.js',
  // public
  'backend/public/css/main.css',
  'backend/public/js/main.js',
  'backend/public/js/favorites.js',
  'backend/public/js/uploads.js',
  'backend/public/js/roles/editor.js',
  'backend/public/js/roles/client.js',
  'backend/public/js/roles/admin.js',
  // views
  'backend/views/layouts/main.ejs',
  'backend/views/partials/header.ejs',
  'backend/views/partials/footer.ejs',
  'backend/views/partials/channel-card.ejs',
  'backend/views/partials/program-card.ejs',
  'backend/views/error.ejs',
  'backend/views/auth/login.ejs',
  'backend/views/auth/register.ejs',
  'backend/views/auth/profile.ejs',
  'backend/views/guest/home.ejs',
  'backend/views/guest/search.ejs',
  'backend/views/client/dashboard.ejs',
  'backend/views/client/favorites.ejs',
  'backend/views/client/subscriptions.ejs',
  'backend/views/editor/grid-builder.ejs',
  'backend/views/admin/users-manage.ejs',
  'backend/views/admin/channels-manage.ejs',
  'backend/views/admin/programs-manage.ejs',
  'backend/views/admin/logs.ejs',
  // tests
  'backend/tests/unit/auth.service.test.js',
  'backend/tests/unit/schedule.service.test.js',
  'backend/tests/integration/health.test.js',
  'backend/tests/integration/rbac.test.js',
];

const ROOT = path.resolve(__dirname, '..');

const CODE_FONT = 'Consolas';
const CODE_SIZE = 18;  // 9pt

function fileBlock(relPath) {
  const out = [];
  const full = path.join(ROOT, relPath);
  let content = '';
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch (e) {
    content = `// файл не найден: ${relPath}`;
  }

  // ограничим размер каждого файла, чтобы не раздуть docx до сотен мегабайт
  const MAX_LINES = 400;
  const lines = content.split(/\r?\n/);
  let body = lines;
  if (lines.length > MAX_LINES) {
    body = lines.slice(0, MAX_LINES);
    body.push('');
    body.push(`// ... файл усечён, всего строк: ${lines.length} ...`);
  }

  out.push(new Paragraph({
    spacing: { before: 240, after: 60 },
    keepNext: true,
    children: [new TextRun({ text: `Файл: ${relPath}`, font: FONT, size: 24, bold: true })],
  }));

  // листинг — таблица с одним столбцом и серым фоном (как в записке Ишгулова)
  const codeRows = body.map((ln) => new TableRow({
    children: [new TableCell({
      borders: BRS,
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: 'F4F4F4', type: ShadingType.CLEAR },
      margins: { top: 20, bottom: 20, left: 100, right: 100 },
      children: [new Paragraph({
        spacing: { line: 240, after: 0 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: ln || ' ', font: CODE_FONT, size: CODE_SIZE })],
      })],
    })],
  }));

  // помещаем как одну таблицу — но если строк много, разобьём на блоки чтобы Word корректно отрисовал
  const CHUNK = 60;
  for (let i = 0; i < codeRows.length; i += CHUNK) {
    out.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: codeRows.slice(i, i + CHUNK),
    }));
  }

  return out;
}

const ch8_listing = [H1('8. Полный листинг разработанного ПО')];
ch8_listing.push(P('В настоящем разделе приведены тексты исходных модулей разработанного программного обеспечения. Файлы сгруппированы по слоям архитектуры MVC: конфигурация, схема и миграции БД, промежуточные обработчики (middlewares), вспомогательные утилиты, модели данных, бизнес-сервисы, контроллеры, маршруты REST API, статические ресурсы и шаблоны представлений, а также модульные и интеграционные тесты.'));
ch8_listing.push(P('Длинные файлы при необходимости приведены с усечением — в соответствующем месте указано общее количество строк в исходнике.'));

FILES.forEach((f) => {
  ch8_listing.push(...fileBlock(f));
});

module.exports = { ch8_listing };
