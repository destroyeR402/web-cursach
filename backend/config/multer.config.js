'use strict';

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/images';
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE_BYTES || '5242880', 10);
const ALLOWED_MIME = (process.env.UPLOAD_ALLOWED_MIME || 'image/png,image/jpeg,image/webp').split(',');

function ensureDir(absDir) {
  if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
}

function buildStorage(subdir) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const abs = path.join(__dirname, '..', UPLOAD_DIR, subdir);
      ensureDir(abs);
      cb(null, abs);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = crypto.randomBytes(12).toString('hex');
      cb(null, `${Date.now()}-${safe}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    const err = new Error(`Недопустимый тип файла. Разрешены: ${ALLOWED_MIME.join(', ')}`);
    err.code = 'INVALID_FILE_TYPE';
    err.status = 400;
    return cb(err, false);
  }
  cb(null, true);
}

function buildUploader(subdir) {
  return multer({
    storage: buildStorage(subdir),
    fileFilter,
    limits: { fileSize: MAX_SIZE, files: 1 },
  });
}

module.exports = {
  uploadChannelLogo: buildUploader('channels'),
  uploadProgramPoster: buildUploader('programs'),
  uploadAvatar: buildUploader('avatars'),
  MAX_SIZE,
  ALLOWED_MIME,
  UPLOAD_DIR,
};
