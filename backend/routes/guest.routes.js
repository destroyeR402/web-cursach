'use strict';

const router = require('express').Router();
const guest = require('../controllers/guest.controller');

router.get('/',        guest.renderHome);
router.get('/search',  guest.renderSearch);

router.get('/api/search',   guest.apiSearch);
router.get('/api/channels', guest.apiChannels);

module.exports = router;
