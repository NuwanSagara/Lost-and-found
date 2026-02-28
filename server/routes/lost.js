const express = require('express');
const router = express.Router();
const {
    getLostItems,
    getLostItem,
    createLostItem,
    updateLostItem,
    deleteLostItem,
} = require('../controllers/lostController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getLostItems).post(protect, createLostItem);
router
    .route('/:id')
    .get(getLostItem)
    .put(protect, updateLostItem)
    .delete(protect, deleteLostItem);

module.exports = router;
