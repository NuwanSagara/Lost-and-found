const express = require('express');
const router = express.Router();
const {
    getLostItems,
    getLostItem,
    createLostItem,
    updateLostItem,
    deleteLostItem,
} = require('../controllers/lostController');
const { protect, requireRoles, USER_ROLES } = require('../middleware/authMiddleware');

router.route('/').get(getLostItems).post(protect, requireRoles(USER_ROLES.CAMPUS_MEMBER, USER_ROLES.ADMIN), createLostItem);
router
    .route('/:id')
    .get(getLostItem)
    .put(protect, requireRoles(USER_ROLES.CAMPUS_MEMBER, USER_ROLES.ADMIN), updateLostItem)
    .delete(protect, requireRoles(USER_ROLES.CAMPUS_MEMBER, USER_ROLES.ADMIN), deleteLostItem);

module.exports = router;
