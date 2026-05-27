'use strict';

const channelModel = require('../models/Channel');
const genreModel = require('../models/Genre');
const favoriteModel = require('../models/Favorite');
const scheduleService = require('../services/schedule.service');
const searchService = require('../services/search.service');
const { startOfDay, addDays, toISODate } = require('../utils/date.util');
const { ok } = require('../utils/response.util');

async function renderHome(req, res, next) {
  try {
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();
    const from = startOfDay(dateParam);
    const to   = addDays(from, 1);
    const [channels, slots, genres] = await Promise.all([
      channelModel.list(),
      scheduleService.getGrid({ from, to, onlyPublished: true }),
      genreModel.list(),
    ]);
    let favChannelIds = [];
    if (req.user) {
      const favs = await favoriteModel.list(req.user.id, 'channel');
      favChannelIds = favs.map((f) => f.target_id);
    }
    res.render('guest/home', {
      title: 'Расписание',
      channels, slots, genres, favChannelIds,
      currentDate: toISODate(from),
      prevDate: toISODate(addDays(from, -1)),
      nextDate: toISODate(addDays(from, 1)),
    });
  } catch (err) { next(err); }
}

async function renderSearch(req, res, next) {
  try {
    const genres = await genreModel.list();
    const q = (req.query.q || '').trim();
    const genreId = req.query.genreId ? parseInt(req.query.genreId, 10) : null;
    const dateStr = req.query.date || '';
    const date = dateStr ? new Date(dateStr) : null;
    const hasFilter = !!(q || genreId || date);
    const results = hasFilter
      ? await searchService.searchPrograms({ q, genreId, date })
      : { mode: 'idle', items: [], count: 0 };
    res.render('guest/search', {
      title: 'Поиск',
      q, genreId, date: dateStr,
      genres, results, hasFilter,
    });
  } catch (err) { next(err); }
}

async function apiSearch(req, res, next) {
  try {
    const results = await searchService.searchPrograms({
      q: req.query.q || '',
      genreId: req.query.genreId || null,
      date: req.query.date || null,
    });
    ok(res, results);
  } catch (err) { next(err); }
}

async function apiChannels(req, res, next) {
  try { ok(res, await channelModel.list()); } catch (err) { next(err); }
}

module.exports = { renderHome, renderSearch, apiSearch, apiChannels };
