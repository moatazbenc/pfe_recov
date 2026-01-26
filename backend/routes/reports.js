const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../config/upload');

router.post('/', auth, controller.submitReport);
router.get('/my/:cycleId', auth, controller.getMyReports);
router.get('/:id', auth, controller.getReportById);
router.post('/:id/attachments', auth, upload.array('files', 10), controller.uploadAttachment);
router.delete('/:id/attachments/:attachmentId', auth, controller.deleteAttachment);
router.get('/:id/attachments/:attachmentId/download', auth, controller.downloadAttachment);

router.get('/cycle/:cycleId', auth, role('Manager', 'HR', 'Admin'), controller.getReportsByCycle);
router.put('/:id/review', auth, role('Manager', 'HR', 'Admin'), controller.reviewReport);

module.exports = router;