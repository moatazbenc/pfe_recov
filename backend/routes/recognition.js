const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/recognitionController');

// All routes require authentication
router.use(auth);

// Create recognition
router.post('/', ctrl.createRecognition);

// Get public feed
router.get('/feed', ctrl.getFeed);

// Get leaderboard
router.get('/leaderboard', ctrl.getLeaderboard);

// Get recognition received by me
router.get('/received', ctrl.getReceived);

// Get recognition sent by me
router.get('/sent', ctrl.getSent);

// Get stats
router.get('/stats', ctrl.getStats);
router.get('/stats/:userId', ctrl.getStats);

// Like/unlike a recognition
router.post('/:id/like', ctrl.toggleLike);

// Delete recognition
router.delete('/:id', ctrl.deleteRecognition);

module.exports = router;
