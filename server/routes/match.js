const express = require('express');
const {
    postTextMatch,
    postImageMatch,
    confirmMatch,
    rejectMatch,
    getPendingMatches,
} = require('../controllers/matchController');
const { runItemMatching } = require('../controllers/itemController');
const { admin, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/text', protect, postTextMatch);
router.post('/image', protect, postImageMatch);
router.post('/run/:id', protect, runItemMatching);
router.patch('/:id/confirm', protect, admin, confirmMatch);
router.patch('/:id/reject', protect, admin, rejectMatch);
router.get('/pending', protect, admin, getPendingMatches);

module.exports = router;
