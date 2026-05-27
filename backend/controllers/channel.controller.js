'use strict';

const channelModel = require('../models/Channel');
const { slugify } = require('../utils/slug.util');
const { ok, created, fail } = require('../utils/response.util');
const fileService = require('../services/file.service');

async function listChannels(req, res, next) {
  try { ok(res, await channelModel.list({ activeOnly: req.query.includeInactive !== '1' })); }
  catch (err) { next(err); }
}

async function getChannel(req, res, next) {
  try {
    const channel = await channelModel.findById(parseInt(req.params.id, 10));
    if (!channel) return fail(res, 404, 'NOT_FOUND', 'Канал не найден');
    ok(res, channel);
  } catch (err) { next(err); }
}

async function createChannel(req, res, next) {
  try {
    const slug = (req.body.slug || slugify(req.body.name));
    const logoPath = fileService.publicUrlFromMulter(req.file, 'channels');
    const channel = await channelModel.create({
      slug, name: req.body.name, description: req.body.description,
      category: req.body.category, logoPath,
    });
    created(res, channel);
  } catch (err) { next(err); }
}

async function updateChannel(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const old = await channelModel.findById(id);
    if (!old) return fail(res, 404, 'NOT_FOUND', 'Канал не найден');
    const logoPath = fileService.publicUrlFromMulter(req.file, 'channels');
    if (logoPath && old.logo_path) fileService.deleteIfExists(old.logo_path);
    const channel = await channelModel.update(id, {
      name: req.body.name, description: req.body.description,
      category: req.body.category,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : undefined,
      logoPath,
    });
    ok(res, channel);
  } catch (err) { next(err); }
}

async function deleteChannel(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const old = await channelModel.findById(id);
    if (old?.logo_path) fileService.deleteIfExists(old.logo_path);
    await channelModel.remove(id);
    ok(res, { deleted: true });
  } catch (err) { next(err); }
}

module.exports = { listChannels, getChannel, createChannel, updateChannel, deleteChannel };
