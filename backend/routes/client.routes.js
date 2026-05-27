'use strict';

const router = require('express').Router();
const c = require('../controllers/client.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireClient } = require('../middlewares/rbac.middleware');

router.use(requireAuth, requireClient);

router.get('/dashboard',      c.renderDashboard);
router.get('/favorites',      c.renderFavorites);
router.get('/subscriptions',  c.renderSubscriptions);

router.get('/api/favorites',       c.listFavorites);
router.get('/api/favorites/items', c.listFavoritesItems);
router.post('/api/favorites',      c.addFavorite);
router.delete('/api/favorites/:type/:targetId', c.removeFavorite);

router.get('/api/subscriptions',    c.listSubscriptions);
router.post('/api/subscriptions',   c.addSubscription);
router.delete('/api/subscriptions/:type/:targetId', c.removeSubscription);
router.post('/api/push-subscription', c.savePushSubscription);
router.delete('/api/push-subscription', c.removePushSubscription);

module.exports = router;
