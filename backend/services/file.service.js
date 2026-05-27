'use strict';

const fs = require('fs');
const path = require('path');

function publicUrlFromMulter(file, subdir) {
  if (!file) return null;
  return `/images/${subdir}/${file.filename}`;
}

function deleteIfExists(relPath) {
  if (!relPath) return;
  const abs = path.join(__dirname, '..', 'public', relPath.replace(/^\/+/, ''));
  fs.promises.unlink(abs).catch(() => {});
}

module.exports = { publicUrlFromMulter, deleteIfExists };
