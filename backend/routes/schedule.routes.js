'use strict';

const router = require('express').Router();
const s = require('../controllers/schedule.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireEditor } = require('../middlewares/rbac.middleware');

router.get('/',         s.getGrid);
router.post('/slots',   requireAuth, requireEditor, s.postSlot);
router.patch('/slots/:id', requireAuth, requireEditor, s.patchSlot);
router.delete('/slots/:id', requireAuth, requireEditor, s.deleteSlot);
router.post('/publish', requireAuth, requireEditor, s.postPublish);

module.exports = router;
