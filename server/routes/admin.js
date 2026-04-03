const express = require('express');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
    getAdminStats,
    getAdminActivity,
    getAdminMatches,
    getAdminMatchById,
    confirmAdminMatch,
    rejectAdminMatch,
    getAdminUsers,
    getAdminUserById,
    updateUserRole,
    toggleSuspendUser,
    deleteUserAccount,
    getAdminLogs,
    getAdminReports,
    deleteAdminReport,
    sendAnnouncement,
    getSettings,
    updateSettings,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, isAdmin);

router.get('/stats', getAdminStats);
router.get('/activity', getAdminActivity);

router.get('/matches', getAdminMatches);
router.get('/matches/:id', getAdminMatchById);
router.patch('/matches/:id/confirm', confirmAdminMatch);
router.patch('/matches/:id/reject', rejectAdminMatch);

router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/suspend', toggleSuspendUser);
router.delete('/users/:id', deleteUserAccount);

router.get('/logs', getAdminLogs);
router.get('/reports', getAdminReports);
router.delete('/reports/:id', deleteAdminReport);
router.post('/notifications', sendAnnouncement);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
