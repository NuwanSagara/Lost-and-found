const express = require('express');
const router = express.Router();
const { searchItems, getMatches } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', searchItems);
router.get('/match/:type/:id', protect, getMatches);

module.exports = router;
