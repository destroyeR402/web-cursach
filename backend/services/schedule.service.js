'use strict';

const slotModel    = require('../models/BroadcastSlot');
const programModel = require('../models/Program');
const channelModel = require('../models/Channel');
const rbac         = require('./rbac.service');
const { rangesOverlap, startOfDay, endOfDay } = require('../utils/date.util');

function err(status, code, message, extra = {}) {
  const e = new Error(message); e.status = status; e.code = code; Object.assign(e, extra); return e;
}

async function validateSlot({ channelId, programId, startsAt, endsAt }) {
  const start = new Date(startsAt);
  const end   = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw err(400, 'INVALID_TIME', 'Некорректные даты слота');
  }
  if (end <= start) throw err(400, 'INVALID_RANGE', 'Время окончания должно быть позже начала');

  const channel = await channelModel.findById(channelId);
  if (!channel) throw err(404, 'CHANNEL_NOT_FOUND', 'Канал не найден');
  const program = await programModel.findById(programId);
  if (!program) throw err(404, 'PROGRAM_NOT_FOUND', 'Передача не найдена');

  const duration = (end - start) / 60000;
  if (program.duration_min && Math.abs(duration - program.duration_min) > 5) {
    // допускаем расхождение в 5 минут (рекламные паузы)
  }
  return { channel, program, start, end };
}

async function checkConflicts({ channelId, startsAt, endsAt, excludeSlotId = null }) {
  return slotModel.findConflicts(channelId, startsAt, endsAt, excludeSlotId);
}

async function createSlot(user, payload) {
  if (!await rbac.canEditChannel(user, payload.channelId)) {
    throw err(403, 'FORBIDDEN', 'Нет прав редактировать данный канал');
  }
  const { start, end } = await validateSlot(payload);
  const conflicts = await checkConflicts({ channelId: payload.channelId, startsAt: start, endsAt: end });
  if (conflicts.length) {
    throw err(409, 'SLOT_CONFLICT', 'Конфликт со слотами', { conflicts });
  }
  return slotModel.create({
    channelId:    payload.channelId,
    programId:    payload.programId,
    startsAt:     start,
    endsAt:       end,
    announcement: payload.announcement || null,
    createdBy:    user.id,
  });
}

async function updateSlot(user, slotId, payload) {
  const slot = await slotModel.findById(slotId);
  if (!slot) throw err(404, 'SLOT_NOT_FOUND', 'Слот не найден');
  if (!await rbac.canEditChannel(user, slot.channel_id)) {
    throw err(403, 'FORBIDDEN', 'Нет прав редактировать данный канал');
  }
  const startsAt = payload.startsAt ? new Date(payload.startsAt) : slot.starts_at;
  const endsAt   = payload.endsAt   ? new Date(payload.endsAt)   : slot.ends_at;
  if (endsAt <= startsAt) throw err(400, 'INVALID_RANGE', 'Время окончания должно быть позже начала');
  const conflicts = await checkConflicts({ channelId: slot.channel_id, startsAt, endsAt, excludeSlotId: slotId });
  if (conflicts.length) throw err(409, 'SLOT_CONFLICT', 'Конфликт со слотами', { conflicts });
  return slotModel.update(slotId, { startsAt, endsAt, announcement: payload.announcement });
}

async function deleteSlot(user, slotId) {
  const slot = await slotModel.findById(slotId);
  if (!slot) throw err(404, 'SLOT_NOT_FOUND', 'Слот не найден');
  if (!await rbac.canEditChannel(user, slot.channel_id)) {
    throw err(403, 'FORBIDDEN', 'Нет прав');
  }
  await slotModel.remove(slotId);
}

async function publishDay(user, channelId, dateStr) {
  if (!await rbac.canEditChannel(user, channelId)) {
    throw err(403, 'FORBIDDEN', 'Нет прав публиковать сетку этого канала');
  }
  const day = new Date(dateStr);
  const slots = await slotModel.listForChannelInRange(channelId, startOfDay(day), endOfDay(day));
  if (!slots.length) throw err(400, 'EMPTY_GRID', 'В выбранных сутках нет слотов для публикации');
  // проверка целостности: нет пересечений между уже добавленными слотами
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (rangesOverlap(slots[i].starts_at, slots[i].ends_at, slots[j].starts_at, slots[j].ends_at)) {
        throw err(409, 'GRID_OVERLAP', 'Сетка содержит пересекающиеся слоты — невозможно опубликовать');
      }
    }
  }
  const count = await slotModel.publishForChannelDate(channelId, startOfDay(day), endOfDay(day));
  return { published: count };
}

async function getGrid({ channelId, from, to, onlyPublished = true }) {
  // overlap=true для канального запроса — чтобы редактор видел передачи,
  // которые начались вчера и переходят через 00:00 в текущий день.
  if (channelId) return slotModel.listForChannelInRange(channelId, from, to, { onlyPublished, overlap: true });
  return slotModel.listInRange(from, to, { onlyPublished });
}

module.exports = { validateSlot, checkConflicts, createSlot, updateSlot, deleteSlot, publishDay, getGrid };
