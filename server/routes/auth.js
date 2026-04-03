const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateMyLocation,
    updateAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/avatarUploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me/location', protect, updateMyLocation);
router.put('/me/avatar', protect, (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (error) => {
        if (error) {
            return res.status(400).json({ message: error.message || 'Profile image upload failed.' });
        }

        return next();
    });
}, updateAvatar);

module.exports = router;
