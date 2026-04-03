const express = require('express');
const router = express.Router();
const {
    submitClaim,
    getClaims,
    updateClaimStatus,
    getClaim,
    updateClaim,
    deleteClaim,
} = require('../controllers/claimController');
const { protect, requireRoles, USER_ROLES } = require('../middleware/authMiddleware');

router.route('/').post(protect, requireRoles(USER_ROLES.CAMPUS_MEMBER, USER_ROLES.ADMIN), submitClaim).get(protect, getClaims);
router.route('/:id').get(protect, getClaim).patch(protect, updateClaim).delete(protect, deleteClaim);
router.route('/:id/status').put(protect, requireRoles(USER_ROLES.ADMIN), updateClaimStatus);

module.exports = router;
