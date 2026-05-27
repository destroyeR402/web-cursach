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
    const favProgramIds = favorites.filter((f) => f.target_type === 'program').map((f) => f.target_id);
    res.render('client/dashboard', { title: 'Личный кабинет', favorites, channels, slots, favProgramIds });
  } catch (err) { next(err); }
}

async function savePushSubscription(req, res, next) {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return fail(res, 400, 'BAD_PAYLOAD', 'Invalid subscription');
    const pushModel = require('../models/PushSubscription');
    const row = await pushModel.add(req.user.id, sub);
    ok(res, { saved: true });
  } catch (err) { next(err); }
}

async function removePushSubscription(req, res, next) {
  try {
    const endpoint = req.body.endpoint || req.query.endpoint;
    if (!endpoint) return fail(res, 400, 'BAD_PAYLOAD', 'Invalid endpoint');
    const pushModel = require('../models/PushSubscription');
    await pushModel.removeByUserAndEndpoint(req.user.id, endpoint);
    ok(res, { removed: true });
  } catch (err) { next(err); }
}

function parseFavoritesQuery(q, kind) {
  const limitDefault = kind === 'channel' ? 12 : 12;
  return {
    limit: Math.min(parseInt(q['l_' + kind] || q.limit || String(limitDefault), 10), 100),
    offset: parseInt(q['o_' + kind] || q.offset || '0', 10),
    search: q['q_' + kind] || '',
    sortBy: q['s_' + kind] || 'added_at',
    sortDir: q['d_' + kind] || 'desc',
  };
}

async function listFavoritesItems(req, res, next) {
  try {
    const kind = req.query.kind === 'channel' ? 'channel' : 'program';
    const params = parseFavoritesQuery(req.query, kind);
    const [items, total] = kind === 'channel'
      ? await Promise.all([
          favoriteModel.listChannels(req.user.id, params),
          favoriteModel.countChannels(req.user.id, params),
        ])
      : await Promise.all([
          favoriteModel.listPrograms(req.user.id, params),
          favoriteModel.countPrograms(req.user.id, params),
        ]);
    ok(res, items, { total, limit: params.limit, offset: params.offset });
  } catch (err) { next(err); }
}

async function renderFavorites(req, res, next) {
  try {
    const chParams = parseFavoritesQuery(req.query, 'channel');
    const prParams = parseFavoritesQuery(req.query, 'program');
    const [favChannels, totalChannels, favPrograms, totalPrograms, carouselPrograms] = await Promise.all([
      favoriteModel.listChannels(req.user.id, chParams),
      favoriteModel.countChannels(req.user.id, chParams),
      favoriteModel.listPrograms(req.user.id, prParams),
      favoriteModel.countPrograms(req.user.id, prParams),
      favoriteModel.listPrograms(req.user.id, { sortBy: 'added_at', sortDir: 'desc', limit: 12, offset: 0 }),
    ]);
    res.render('client/favorites', {
      title: 'Избранное', active: 'favorites',
      favChannels, totalChannels, chParams,
      favPrograms, totalPrograms, prParams,
      carouselPrograms,
    });
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
  listFavorites, listFavoritesItems, addFavorite, removeFavorite,
  listSubscriptions, addSubscription, removeSubscription,
  renderDashboard, renderFavorites, renderSubscriptions,
};
