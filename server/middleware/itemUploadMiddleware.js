const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024,
        fieldSize: 12 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            callback(new Error('Only JPEG, PNG, WEBP, and GIF images are supported.'));
            return;
        }

        callback(null, true);
    },
});

module.exports = { upload };
