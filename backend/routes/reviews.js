const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/reviewController');

router.use(auth);

// Templates
router.post('/templates', role('ADMIN', 'HR'), ctrl.createTemplate);
router.get('/templates', ctrl.getTemplates);
router.delete('/templates/:id', role('ADMIN', 'HR'), ctrl.deleteTemplate);

// Reviews
router.post('/', role('ADMIN', 'HR', 'TEAM_LEADER'), ctrl.createReview);
router.post('/batch', role('ADMIN', 'HR'), ctrl.batchAssignReviews);

router.get('/my', ctrl.getMyReviews);
router.get('/about-me', ctrl.getAboutMe);
router.get('/all', role('ADMIN', 'HR'), ctrl.getAllReviews);
router.get('/nine-box', role('ADMIN', 'HR', 'TEAM_LEADER'), ctrl.getNineBoxGrid);

router.put('/:id/submit', ctrl.submitReview);
router.put('/:id/draft', ctrl.saveDraft);
router.delete('/:id', role('ADMIN', 'HR'), ctrl.deleteReview);

module.exports = router;
