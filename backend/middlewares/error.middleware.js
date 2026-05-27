'use strict';

function notFound(req, res, next) {
  if (req.accepts('html')) {
    return res.status(404).render('error', {
      title: 'Не найдено',
      status: 404,
      message: `Маршрут ${req.method} ${req.originalUrl} не найден`,
      user: req.user || null,
    });
  }
  return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'Маршрут не найден' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[err] ${req.method} ${req.originalUrl} ·`, err);
  } else {
    console.error(`[err] ${code} · ${err.message}`);
  }

  const safeMessage = status >= 500 ? 'Внутренняя ошибка сервера' : err.message;

  if (req.accepts('html') && !req.originalUrl.startsWith('/api/')) {
    return res.status(status).render('error', {
      title: 'Ошибка',
      status,
      message: safeMessage,
      user: req.user || null,
    });
  }
  const body = { ok: false, error: code, message: safeMessage };
  if (err.conflicts) body.conflicts = err.conflicts;
  return res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
