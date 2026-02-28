const express = require('express');
const router = express.Router();
const {
    getFoundItems,
    getFoundItem,
    createFoundItem,
    updateFoundItem,
    deleteFoundItem,
} = require('../controllers/foundController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getFoundItems).post(protect, createFoundItem);
router
    .route('/:id')
    .get(getFoundItem)
    .put(protect, updateFoundItem)
    .delete(protect, deleteFoundItem);

module.exports = router;
