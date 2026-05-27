'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const expressLayouts = require('express-ejs-layouts');

const { pool, testConnection } = require('./config/database');
const loggerMw = require('./middlewares/logger.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { attachUser } = require('./middlewares/auth.middleware');

const authRoutes     = require('./routes/auth.routes');
const guestRoutes    = require('./routes/guest.routes');
const channelRoutes  = require('./routes/channel.routes');
const programRoutes  = require('./routes/program.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const clientRoutes   = require('./routes/client.routes');
const adminRoutes    = require('./routes/admin.routes');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || 'localhost';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false, // EJS-страницы используют inline-стили/скрипты
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(loggerMw);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  name: process.env.SESSION_NAME || 'tv_sched.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE_MS || '86400000', 10),
  },
}));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: true }));
// jQuery — раздаём из node_modules чтобы не зависеть от CDN
app.use('/vendor/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));

app.use(attachUser);

// === Маршруты ===
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/client', clientRoutes);
app.use('/admin',  adminRoutes);
app.use('/',       guestRoutes);

// === Обработка ошибок ===
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.warn('[pg] WARN — не удалось подключиться к БД при старте:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`[server] http://${HOST}:${PORT}  ·  NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

if (require.main === module) start();
module.exports = app;
