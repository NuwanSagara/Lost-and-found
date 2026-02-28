const express = require('express');
const router = express.Router();
const {
    submitClaim,
    getClaims,
    updateClaimStatus,
    getClaim
} = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, submitClaim).get(protect, getClaims);
router.route('/:id').get(protect, getClaim);
router.route('/:id/status').put(protect, updateClaimStatus);

module.exports = router;
