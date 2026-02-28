const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    getChat,
    addMessage
} = require('../controllers/communicationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markAsRead);

router.get('/chat/:claimId', protect, getChat);
router.post('/chat/:claimId/message', protect, addMessage);

module.exports = router;
