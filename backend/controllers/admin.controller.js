'use strict';

const userModel = require('../models/User');
const roleModel = require('../models/Role');
const channelModel = require('../models/Channel');
const programModel = require('../models/Program');
const genreModel = require('../models/Genre');
const ageRatingModel = require('../models/AgeRating');
const auditModel = require('../models/AuditLog');
const { ok, fail } = require('../utils/response.util');

async function listUsers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.q || '';
    const users = await userModel.list({ limit, offset, search });
    const total = await userModel.count({ search });
    ok(res, users.map(userModel.publicFields), { total, limit, offset });
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

async function listAudit(req, res, next) {
  try {
    const rows = await auditModel.list({
      limit: parseInt(req.query.limit || '100', 10),
      offset: parseInt(req.query.offset || '0', 10),
      userId: req.query.userId ? parseInt(req.query.userId, 10) : null,
      action: req.query.action || null,
    });
    ok(res, rows);
  } catch (err) { next(err); }
}

async function renderUsers(req, res, next) {
  try {
    const users = await userModel.list({ limit: 100 });
    const roles = await roleModel.list();
    const channels = await channelModel.list({ activeOnly: false });
    res.render('admin/users-manage', { title: 'Пользователи', users: users.map(userModel.publicFields), roles, channels });
  } catch (err) { next(err); }
}

async function renderLogs(req, res, next) {
  try {
    const logs = await auditModel.list({ limit: 200 });
    res.render('admin/logs', { title: 'Журнал', logs });
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
