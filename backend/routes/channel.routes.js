'use strict';

const router = require('express').Router();
const ch = require('../controllers/channel.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireEditor, requireAdmin } = require('../middlewares/rbac.middleware');
const { handleUpload } = require('../middlewares/file.middleware');
const { uploadChannelLogo } = require('../config/multer.config');

router.get('/', ch.listChannels);
router.get('/:id', ch.getChannel);

router.post('/',
  requireAuth, requireAdmin,
  handleUpload(uploadChannelLogo, 'logo'),
  ch.createChannel
);

router.patch('/:id',
  requireAuth, requireEditor,
  handleUpload(uploadChannelLogo, 'logo'),
  ch.updateChannel
);

router.delete('/:id', requireAuth, requireAdmin, ch.deleteChannel);

module.exports = router;
