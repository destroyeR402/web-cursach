'use strict';

const programModel = require('../models/Program');
const { ok, created, fail } = require('../utils/response.util');
const fileService = require('../services/file.service');

async function listPrograms(req, res, next) {
  try {
    const data = await programModel.list({
      search: req.query.q || '',
      genreId: req.query.genreId ? parseInt(req.query.genreId, 10) : null,
      limit: parseInt(req.query.limit || '50', 10),
      offset: parseInt(req.query.offset || '0', 10),
    });
    ok(res, data);
  } catch (err) { next(err); }
}

async function getProgram(req, res, next) {
  try {
    const p = await programModel.findById(parseInt(req.params.id, 10));
    if (!p) return fail(res, 404, 'NOT_FOUND', 'Передача не найдена');
    ok(res, p);
  } catch (err) { next(err); }
}

async function createProgram(req, res, next) {
  try {
    const posterPath = fileService.publicUrlFromMulter(req.file, 'programs');
    const p = await programModel.create({
      title: req.body.title,
      description: req.body.description,
      durationMin: parseInt(req.body.durationMin, 10),
      genreId: req.body.genreId ? parseInt(req.body.genreId, 10) : null,
      ageRatingId: req.body.ageRatingId ? parseInt(req.body.ageRatingId, 10) : null,
      posterPath,
    });
    created(res, p);
  } catch (err) { next(err); }
}

async function updateProgram(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const old = await programModel.findById(id);
    if (!old) return fail(res, 404, 'NOT_FOUND', 'Передача не найдена');
    const posterPath = fileService.publicUrlFromMulter(req.file, 'programs');
    if (posterPath && old.poster_path) fileService.deleteIfExists(old.poster_path);
    const p = await programModel.update(id, {
      title: req.body.title,
      description: req.body.description,
      durationMin: req.body.durationMin ? parseInt(req.body.durationMin, 10) : undefined,
      genreId: req.body.genreId ? parseInt(req.body.genreId, 10) : undefined,
      ageRatingId: req.body.ageRatingId ? parseInt(req.body.ageRatingId, 10) : undefined,
      posterPath,
    });
    ok(res, p);
  } catch (err) { next(err); }
}

async function deleteProgram(req, res, next) {
  try {
    await programModel.archive(parseInt(req.params.id, 10));
    ok(res, { archived: true });
  } catch (err) { next(err); }
}

module.exports = { listPrograms, getProgram, createProgram, updateProgram, deleteProgram };
