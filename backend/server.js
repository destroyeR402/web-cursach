'use strict'

require('dotenv').config()

const path = require('path')
const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const expressLayouts = require('express-ejs-layouts')

const { pool, testConnection } = require('./config/database')
const loggerMw = require('./middlewares/logger.middleware')
const { notFound, errorHandler } = require('./middlewares/error.middleware')
const { attachUser } = require('./middlewares/auth.middleware')

const authRoutes = require('./routes/auth.routes')
const guestRoutes = require('./routes/guest.routes')
const channelRoutes = require('./routes/channel.routes')
const programRoutes = require('./routes/program.routes')
const scheduleRoutes = require('./routes/schedule.routes')
const clientRoutes = require('./routes/client.routes')
const adminRoutes = require('./routes/admin.routes')
const reminderScheduler = require('./services/reminder.scheduler')

function formatPgStartupError(err) {
  const raw = String(err?.message || err || 'Неизвестная ошибка')

  // Windows + localized PostgreSQL may produce mojibake in message text.
  // For pg_hba errors, we can still extract quoted values and print a clean message.
  if (/pg_hba\.conf/i.test(raw)) {
    const quoted = Array.from(raw.matchAll(/"([^"]+)"/g), (m) => m[1])
    const host = quoted[0] || 'unknown-host'
    const user = quoted[1] || process.env.PG_USER || 'unknown-user'
    const database = quoted[2] || process.env.PG_DATABASE || 'unknown-db'
    return `в pg_hba.conf нет записи для хоста "${host}", пользователя "${user}", базы "${database}"`
  }

  return raw
}

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || 'localhost'

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(expressLayouts)
app.set('layout', 'layouts/main')
app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false, // EJS-страницы используют inline-стили/скрипты
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(loggerMw)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

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
}))

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: true }))
// jQuery — раздаём из node_modules чтобы не зависеть от CDN
app.use('/vendor/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')))

app.use(attachUser)

// === Маршруты ===
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use('/auth', authRoutes)
app.use('/api/channels', channelRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/client', clientRoutes)
app.use('/admin', adminRoutes)
app.use('/', guestRoutes)

// === Обработка ошибок ===
app.use(notFound)
app.use(errorHandler)

async function start() {
  try {
    await testConnection()
  } catch (err) {
    console.warn('[pg] WARN — не удалось подключиться к БД при старте:', formatPgStartupError(err))
  }
  app.listen(PORT, () => {
    console.log(`[server] http://${HOST}:${PORT}  ·  NODE_ENV=${process.env.NODE_ENV || 'development'}`)
    // start reminders scheduler
    try { reminderScheduler.start() } catch (e) { console.error('[reminder] failed to start scheduler', e) }
  })
}

if (require.main === module) start()
module.exports = app
