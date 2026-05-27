'use strict';

const userModel = require('../models/User');
const roleModel = require('../models/Role');
const channelModel = require('../models/Channel');
const programModel = require('../models/Program');
const genreModel = require('../models/Genre');
const ageRatingModel = require('../models/AgeRating');
const auditModel = require('../models/AuditLog');
const { ok, fail } = require('../utils/response.util');

function parseUsersQuery(q) {
  let isActive = null;
  if (q.isActive === 'true') isActive = true;
  else if (q.isActive === 'false') isActive = false;
  return {
    limit: Math.min(parseInt(q.limit || '20', 10), 200),
    offset: parseInt(q.offset || '0', 10),
    search: q.q || '',
    role: q.role || null,
    isActive,
    sortBy: q.sortBy || 'created_at',
    sortDir: q.sortDir || 'desc',
  };
}

async function listUsers(req, res, next) {
  try {
    const params = parseUsersQuery(req.query);
    const [users, total] = await Promise.all([
      userModel.list(params),
      userModel.count(params),
    ]);
    ok(res, users.map(userModel.publicFields), { total, limit: params.limit, offset: params.offset });
  } catch (err) { next(err); }
}

async function changeRole(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;
    const allowed = (await roleModel.list()).map((r) => r.code);
    if (!allowed.includes(role)) return fail(res, 400, 'BAD_ROLE', 'Недопустимая роль');
    const updated = await userModel.changeRole(id, role);
    await auditModel.log({ userId: req.user.id, action: 'admin.change_role', entity: 'user', entityId: id, meta: { role } });
    ok(res, userModel.publicFields(updated));
  } catch (err) { next(err); }
}

async function toggleActive(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const isActive = req.body.isActive === true || req.body.isActive === 'true';
    const updated = await userModel.setActive(id, isActive);
    await auditModel.log({ userId: req.user.id, action: 'admin.toggle_active', entity: 'user', entityId: id, meta: { isActive } });
    ok(res, userModel.publicFields(updated));
  } catch (err) { next(err); }
}

async function assignEditor(req, res, next) {
  try {
    const channelId = parseInt(req.body.channelId, 10);
    const userId = parseInt(req.body.userId, 10);
    await channelModel.assignEditor(channelId, userId);
    await auditModel.log({ userId: req.user.id, action: 'admin.assign_editor', entity: 'channel', entityId: channelId, meta: { userId } });
    ok(res, { assigned: true });
  } catch (err) { next(err); }
}

async function unassignEditor(req, res, next) {
  try {
    const channelId = parseInt(req.params.channelId, 10);
    const userId = parseInt(req.params.userId, 10);
    await channelModel.unassignEditor(channelId, userId);
    ok(res, { unassigned: true });
  } catch (err) { next(err); }
}

function parseAuditQuery(q) {
  return {
    limit: Math.min(parseInt(q.limit || '50', 10), 500),
    offset: parseInt(q.offset || '0', 10),
    userId: q.userId ? parseInt(q.userId, 10) : null,
    action: q.action || null,
    entity: q.entity || null,
    dateFrom: q.dateFrom || null,
    dateTo: q.dateTo || null,
    search: q.q || null,
    sortBy: q.sortBy || 'created_at',
    sortDir: q.sortDir || 'desc',
  };
}

async function listAudit(req, res, next) {
  try {
    const params = parseAuditQuery(req.query);
    const [rows, total] = await Promise.all([
      auditModel.list(params),
      auditModel.count(params),
    ]);
    ok(res, rows, { total, limit: params.limit, offset: params.offset });
  } catch (err) { next(err); }
}

async function renderUsers(req, res, next) {
  try {
    const params = parseUsersQuery(req.query);
    const [users, total, counts, roles, channels] = await Promise.all([
      userModel.list(params),
      userModel.count(params),
      userModel.roleCounts(),
      roleModel.list(),
      channelModel.list({ activeOnly: false }),
    ]);
    res.render('admin/users-manage', {
      title: 'Пользователи', active: 'users',
      users: users.map(userModel.publicFields),
      total, params, counts, roles, channels,
    });
  } catch (err) { next(err); }
}

async function renderLogs(req, res, next) {
  try {
    const params = parseAuditQuery(req.query);
    const [logs, total, actions, entities] = await Promise.all([
      auditModel.list(params),
      auditModel.count(params),
      auditModel.distinctActions(),
      auditModel.distinctEntities(),
    ]);
    res.render('admin/logs', {
      title: 'Журнал', active: 'logs',
      logs, total, params, actions, entities,
    });
  } catch (err) { next(err); }
}

async function renderChannels(req, res, next) {
  try {
    const channels = await channelModel.list({ activeOnly: false });
    res.render('admin/channels-manage', { title: 'Каналы', channels });
  } catch (err) { next(err); }
}

async function renderPrograms(req, res, next) {
  try {
    const programs = await programModel.list({ limit: 500, offset: 0 });
    const genres = await genreModel.list();
    const ageRatings = await ageRatingModel.list();
    res.render('admin/programs-manage', { title: 'Передачи', programs, genres, ageRatings });
  } catch (err) { next(err); }
}

module.exports = {
  listUsers, changeRole, toggleActive,
  assignEditor, unassignEditor,
  listAudit,
  renderUsers, renderLogs, renderChannels, renderPrograms,
};
