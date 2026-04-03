const express = require('express');
const { upload } = require('../middleware/itemUploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { createItem, getItems, getMyItems, getItem, getItemMatches, updateItem, deleteItem } = require('../controllers/itemController');

const router = express.Router();

router.get('/', getItems); // Public browse - no auth required
router.post('/', protect, upload.single('image'), createItem);
router.get('/mine', protect, getMyItems);
router.get('/:id', getItem);
router.get('/:id/matches', protect, getItemMatches);
router.put('/:id', protect, upload.single('image'), updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
