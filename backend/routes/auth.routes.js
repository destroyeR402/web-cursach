'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { requireAuth, requireGuest } = require('../middlewares/auth.middleware');
const { handleUpload } = require('../middlewares/file.middleware');
const { uploadAvatar } = require('../config/multer.config');

// защита от brute-force на /login и /register
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,         // 15 минут
  max: 10,                          // не более 10 попыток с одного IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток входа. Повторите через 15 минут.' },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,         // 1 час
  max: 5,                           // не более 5 регистраций с одного IP в час
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'TOO_MANY_ATTEMPTS', message: 'Слишком много регистраций. Повторите через час.' },
});

router.get('/login',    requireGuest, auth.renderLogin);
router.get('/register', requireGuest, auth.renderRegister);
router.get('/profile',  requireAuth,  auth.renderProfile);

router.post('/register',
  registerLimiter,
  body('email').isEmail().withMessage('Некорректный email'),
  body('username').isLength({ min: 3, max: 32 }).withMessage('Логин 3–32 символа'),
  body('password').isLength({ min: 6 }).withMessage('Пароль не менее 6 символов'),
  validate,
  auth.postRegister
);

router.post('/login',
  loginLimiter,
  body('password').notEmpty().withMessage('Пароль обязателен'),
  validate,
  auth.postLogin
);

router.post('/logout', auth.postLogout);
router.get('/me', auth.getMe);

router.patch('/profile',
  requireAuth,
  handleUpload(uploadAvatar, 'avatar'),
  auth.patchProfile
);

router.patch('/password',
  requireAuth,
  body('currentPassword').notEmpty().withMessage('Введите текущий пароль'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль не менее 6 символов'),
  validate,
  auth.patchPassword
);

router.delete('/profile', requireAuth, auth.deleteAccount);

module.exports = router;
