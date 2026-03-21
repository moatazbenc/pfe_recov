const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/surveyController');

router.use(auth);

router.post('/', role('ADMIN', 'HR', 'TEAM_LEADER'), ctrl.createSurvey);
router.put('/:id/publish', role('ADMIN', 'HR', 'TEAM_LEADER'), ctrl.publishSurvey);
router.put('/:id/close', role('ADMIN', 'HR', 'TEAM_LEADER'), ctrl.closeSurvey);
router.post('/:id/respond', ctrl.submitResponse);
router.get('/active', ctrl.getActiveSurveys);
router.get('/all', role('ADMIN', 'HR'), ctrl.getAllSurveys);
router.get('/:id/results', ctrl.getSurveyResults);
router.delete('/:id', role('ADMIN', 'HR'), ctrl.deleteSurvey);

module.exports = router;
