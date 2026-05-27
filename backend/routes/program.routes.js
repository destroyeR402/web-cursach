'use strict';

const router = require('express').Router();
const p = require('../controllers/program.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireEditor } = require('../middlewares/rbac.middleware');
const { handleUpload } = require('../middlewares/file.middleware');
const { uploadProgramPoster } = require('../config/multer.config');

router.get('/', p.listPrograms);
router.get('/:id', p.getProgram);

router.post('/',
  requireAuth, requireEditor,
  handleUpload(uploadProgramPoster, 'poster'),
  p.createProgram
);

router.patch('/:id',
  requireAuth, requireEditor,
  handleUpload(uploadProgramPoster, 'poster'),
  p.updateProgram
);

router.delete('/:id', requireAuth, requireEditor, p.deleteProgram);

module.exports = router;
