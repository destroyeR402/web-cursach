'use strict';

const multer = require('multer');

function handleUpload(uploader, fieldName) {
  return (req, res, next) => {
    uploader.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') err.message = 'Файл превышает максимальный размер (5 МБ)';
        err.status = 400;
      }
      return next(err);
    });
  };
}

module.exports = { handleUpload };
