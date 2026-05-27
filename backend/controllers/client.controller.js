'use strict';

const favoriteModel = require('../models/Favorite');
const subscriptionModel = require('../models/Subscription');
const channelModel = require('../models/Channel');
const programModel = require('../models/Program');
const slotModel = require('../models/BroadcastSlot');
const userModel = require('../models/User');
const { ok, created, fail } = require('../utils/response.util');
const { startOfDay, endOfDay } = require('../utils/date.util');

async function listFavorites(req, res, next) {
  try { ok(res, await favoriteModel.list(req.user.id, req.query.type || null)); }
  catch (err) { next(err); }
}

async function addFavorite(req, res, next) {
  try {
    const { type, targetId } = req.body;
    if (!['channel','program'].includes(type)) return fail(res, 400, 'BAD_TYPE', 'Недопустимый тип');
    const row = await favoriteModel.add(req.user.id, type, parseInt(targetId, 10));
    created(res, row || { duplicate: true });
  } catch (err) { next(err); }
}

async function removeFavorite(req, res, next) {
  try {
    await favoriteModel.remove(req.user.id, req.params.type, parseInt(req.params.targetId, 10));
    ok(res, { deleted: true });
  } catch (err) { next(err); }
}

async function listSubscriptions(req, res, next) {
  try { ok(res, await subscriptionModel.list(req.user.id)); }
  catch (err) { next(err); }
}

async function addSubscription(req, res, next) {
  try {
    const { type, targetId, notifyEmail, notifyPush } = req.body;
    if (!['channel','program','genre'].includes(type)) return fail(res, 400, 'BAD_TYPE', 'Недопустимый тип');
    const row = await subscriptionModel.add(req.user.id, type, parseInt(targetId, 10), {
      notifyEmail: notifyEmail !== false, notifyPush: !!notifyPush,
    });
    created(res, row);
  } catch (err) { next(err); }
}

async function removeSubscription(req, res, next) {
  try {
    await subscriptionModel.remove(req.user.id, req.params.type, parseInt(req.params.targetId, 10));
    ok(res, { deleted: true });
  } catch (err) { next(err); }
}

async function renderDashboard(req, res, next) {
  try {
    const favorites = await favoriteModel.list(req.user.id);
    const channels = await channelModel.list();
    const today = new Date();
    const slots = await slotModel.listInRange(startOfDay(today), endOfDay(today), { onlyPublished: true });
    res.render('client/dashboard', { title: 'Личный кабинет', favorites, channels, slots });
  } catch (err) { next(err); }
}

async function renderFavorites(req, res, next) {
  try {
    const favorites = await favoriteModel.list(req.user.id);
    const channelIds = favorites.filter((f) => f.target_type === 'channel').map((f) => f.target_id);
    const programIds = favorites.filter((f) => f.target_type === 'program').map((f) => f.target_id);
    const favChannels = await channelModel.findByIds(channelIds);
    const favPrograms = await programModel.findByIds(programIds);
    res.render('client/favorites', { title: 'Избранное', favChannels, favPrograms });
  } catch (err) { next(err); }
}

async function renderSubscriptions(req, res, next) {
  try {
    const subs = await subscriptionModel.list(req.user.id);
    const channels = await channelModel.list();
    // обогащаем подписки деталями каналов / передач для удобного отображения
    const channelMap = Object.fromEntries(channels.map((c) => [c.id, c]));
    const programIds = subs.filter((s) => s.target_type === 'program').map((s) => s.target_id);
    const programs = programIds.length ? await programModel.findByIds(programIds) : [];
    const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));
    const enrichedSubs = subs.map((s) => ({
      ...s,
      channel: s.target_type === 'channel' ? channelMap[s.target_id] : null,
      program: s.target_type === 'program' ? programMap[s.target_id] : null,
    }));
    res.render('client/subscriptions', { title: 'Подписки', subs: enrichedSubs, channels });
  } catch (err) { next(err); }
}

module.exports = {
  listFavorites, addFavorite, removeFavorite,
  listSubscriptions, addSubscription, removeSubscription,
  renderDashboard, renderFavorites, renderSubscriptions,
};
