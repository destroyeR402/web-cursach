'use strict';

const morgan = require('morgan');

const format = process.env.LOG_FORMAT || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev');

module.exports = morgan(format, {
  skip: (req) => req.url === '/health' || req.url.startsWith('/public/'),
});
