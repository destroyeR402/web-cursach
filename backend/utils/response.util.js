'use strict';

function ok(res, data = null, meta = null) {
  const body = { ok: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

function created(res, data = null) {
  return res.status(201).json({ ok: true, data });
}

function fail(res, status, code, message, extra) {
  return res.status(status).json({ ok: false, error: code, message, ...(extra || {}) });
}

module.exports = { ok, created, fail };
