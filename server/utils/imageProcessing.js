const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const ensureUploadsDirectory = async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
};

const normalizeImageBuffer = async (inputBuffer) =>
    sharp(inputBuffer)
        .rotate()
        .resize({
            width: 800,
            height: 800,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

const processItemImage = async ({ fileBuffer, base64Value }) => {
    if (!fileBuffer && !base64Value) {
        return {
            image_url: null,
            image_base64: null,
        };
    }

    const rawBuffer = fileBuffer
        ? fileBuffer
        : Buffer.from(String(base64Value).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ''), 'base64');

    const optimizedBuffer = await normalizeImageBuffer(rawBuffer);

    await ensureUploadsDirectory();

    const fileName = `${crypto.randomUUID()}.jpg`;
    await fs.writeFile(path.join(uploadsDir, fileName), optimizedBuffer);

    return {
        image_url: `/uploads/${fileName}`,
        image_base64: optimizedBuffer.toString('base64'),
    };
};

const deleteUploadedImage = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
        return;
    }

    const relativeFilePath = imageUrl.replace(/^\/+/, '');
    const resolvedPath = path.resolve(path.join(__dirname, '..', relativeFilePath));
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(`${resolvedUploadsDir}${path.sep}`)) {
        return;
    }

    try {
        await fs.unlink(resolvedPath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

module.exports = {
    processItemImage,
    deleteUploadedImage,
};
