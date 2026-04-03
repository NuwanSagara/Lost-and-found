const fs = require('fs');
const path = require('path');
const multer = require('multer');

const avatarDirectory = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(avatarDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, avatarDirectory);
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const safeUserId = String(req.user?._id || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
        callback(null, `${safeUserId}-${Date.now()}${extension}`);
    },
});

const uploadAvatar = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            callback(new Error('Only JPG, JPEG, and PNG images are allowed.'));
            return;
        }

        callback(null, true);
    },
});

module.exports = { uploadAvatar, avatarDirectory };
