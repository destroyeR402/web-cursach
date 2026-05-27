'use strict';

const channelModel = require('../models/Channel');

const RANK = { guest: 0, client: 1, editor: 2, admin: 3 };

function hasRole(user, minRole) {
  if (!user) return minRole === 'guest';
  return (RANK[user.role] ?? -1) >= (RANK[minRole] ?? 99);
}

async function canEditChannel(user, channelId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'editor') return false;
  return channelModel.isEditorOf(user.id, channelId);
}

function assertRole(user, minRole) {
  if (!hasRole(user, minRole)) {
    const e = new Error(`Доступ запрещён (требуется роль ≥ ${minRole})`);
    e.status = 403; e.code = 'FORBIDDEN'; throw e;
  }
}

module.exports = { hasRole, canEditChannel, assertRole, RANK };
