'use strict';

const ROLES = ['guest', 'client', 'editor', 'admin'];

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED', message: 'Требуется авторизация' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        ok: false, error: 'FORBIDDEN',
        message: `Недостаточно прав. Требуется одна из ролей: ${allowed.join(', ')}`,
      });
    }
    next();
  };
}

const requireClient = requireRole('client', 'editor', 'admin');
const requireEditor = requireRole('editor', 'admin');
const requireAdmin = requireRole('admin');

module.exports = { ROLES, requireRole, requireClient, requireEditor, requireAdmin };
