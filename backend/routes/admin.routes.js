'use strict';

const router = require('express').Router();
const a = require('../controllers/admin.controller');
const sc = require('../controllers/schedule.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin, requireEditor } = require('../middlewares/rbac.middleware');

router.use(requireAuth);

router.get('/users',     requireAdmin, a.renderUsers);
router.get('/logs',      requireAdmin, a.renderLogs);
router.get('/channels',  requireAdmin, a.renderChannels);
router.get('/programs',  requireEditor, a.renderPrograms);
router.get('/grid',      requireEditor, sc.renderGridBuilder);

router.get('/api/users',                  requireAdmin, a.listUsers);
router.patch('/api/users/:id/role',       requireAdmin, a.changeRole);
router.patch('/api/users/:id/active',     requireAdmin, a.toggleActive);
router.post('/api/channels/editors',      requireAdmin, a.assignEditor);
router.delete('/api/channels/:channelId/editors/:userId', requireAdmin, a.unassignEditor);
router.get('/api/audit',                  requireAdmin, a.listAudit);
router.get('/api/channels',               requireAdmin, a.listChannelsAdmin);

module.exports = router;
