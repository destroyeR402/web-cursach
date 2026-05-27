'use strict';

const scheduleService = require('../services/schedule.service');
const channelModel = require('../models/Channel');
const programModel = require('../models/Program');
const notificationService = require('../services/notification.service');
const { ok, created } = require('../utils/response.util');
const { startOfDay, endOfDay, toISODate } = require('../utils/date.util');

async function getGrid(req, res, next) {
  try {
    const channelId = req.query.channelId ? parseInt(req.query.channelId, 10) : null;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const from = startOfDay(date);
    const to = endOfDay(date);
    const slots = await scheduleService.getGrid({ channelId, from, to, onlyPublished: req.query.draft !== '1' });
    ok(res, slots);
  } catch (err) { next(err); }
}

async function postSlot(req, res, next) {
  try {
    const slot = await scheduleService.createSlot(req.user, {
      channelId: parseInt(req.body.channelId, 10),
      programId: parseInt(req.body.programId, 10),
      startsAt: req.body.startsAt,
      endsAt: req.body.endsAt,
      announcement: req.body.announcement,
    });
    created(res, slot);
  } catch (err) { next(err); }
}

async function patchSlot(req, res, next) {
  try {
    const slot = await scheduleService.updateSlot(req.user, parseInt(req.params.id, 10), req.body);
    ok(res, slot);
  } catch (err) { next(err); }
}

async function deleteSlot(req, res, next) {
  try {
    await scheduleService.deleteSlot(req.user, parseInt(req.params.id, 10));
    ok(res, { deleted: true });
  } catch (err) { next(err); }
}

async function postPublish(req, res, next) {
  try {
    const channelId = parseInt(req.body.channelId, 10);
    const date = req.body.date;
    const result = await scheduleService.publishDay(req.user, channelId, date);
    const channel = await channelModel.findById(channelId);
    await notificationService.enqueueForTarget({
      type: 'channel', targetId: channelId,
      subject: `Опубликована сетка ${channel?.name || ''} на ${date}`,
      body: `На канале «${channel?.name}» опубликована сетка вещания на ${date}.`,
    });
    await notificationService.flush();
    ok(res, result);
  } catch (err) { next(err); }
}

async function renderGridBuilder(req, res, next) {
  try {
    const user = req.user;
    const channels = user.role === 'admin'
      ? await channelModel.list({ activeOnly: false })
      : await channelModel.editorChannels(user.id);
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const channelId = parseInt(req.query.channelId || channels[0]?.id || 0, 10);
    let slots = [];
    if (channelId) {
      slots = await scheduleService.getGrid({
        channelId, from: startOfDay(date), to: endOfDay(date), onlyPublished: false,
      });
    }
    const programs = await programModel.list({ limit: 200 });
    res.render('editor/grid-builder', {
      title: 'Редактор сетки',
      channels, programs, slots,
      currentChannelId: channelId,
      currentDate: toISODate(date),
    });
  } catch (err) { next(err); }
}

module.exports = { getGrid, postSlot, patchSlot, deleteSlot, postPublish, renderGridBuilder };
