const { Item, ITEM_CATEGORIES } = require('../models/Item');
const Match = require('../models/Match');
const { USER_ROLES, normalizeRole } = require('../middleware/authMiddleware');
const { processItemImage, deleteUploadedImage } = require('../utils/imageProcessing');
const { matchItem, rerunMatchForItem } = require('../services/matching/matchPipeline');

const normalizeCoordinate = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const isValidLatitude = (value) => typeof value === 'number' && value >= -90 && value <= 90;
const isValidLongitude = (value) => typeof value === 'number' && value >= -180 && value <= 180;
const buildCoordinateLabel = (lat, lng) => `Reported coordinates (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
const normalizeLocationSource = (value) => (value === 'device' ? 'device' : 'manual');

const extractItemPayload = (body = {}) => {
    const normalizedLocationName = String(body.location_name || body.location || '').trim();
    const normalizedLat = normalizeCoordinate(body.lat ?? body.latitude);
    const normalizedLng = normalizeCoordinate(body.lng ?? body.longitude);
    const hasCoordinates = isValidLatitude(normalizedLat) && isValidLongitude(normalizedLng);
    const normalizedLocationSource = normalizeLocationSource(body.location_source);
    const parsedAccuracy = normalizeCoordinate(body.location_accuracy);
    const hasManualLocationName = Boolean(normalizedLocationName);

    return {
        type: body.type,
        title: body.title,
        description: body.description,
        category: body.category,
        normalizedLocationName,
        normalizedLat,
        normalizedLng,
        hasCoordinates,
        normalizedLocationSource,
        parsedAccuracy,
        hasManualLocationName,
        reportedAt: body.reportedAt,
        eventDate: body.event_date,
        urgency: body.urgency,
        isAnonymous: body.isAnonymous,
    };
};

const validateItemPayload = ({
    type,
    title,
    description,
    category,
    hasManualLocationName,
    normalizedLat,
    normalizedLng,
    hasCoordinates,
    normalizedLocationSource,
    parsedAccuracy,
}) => {
    if (!type || !['lost', 'found'].includes(type)) {
        return 'Item type must be either lost or found.';
    }

    if (!title || !description || !category) {
        return 'title, description, and category are required.';
    }

    if (!hasManualLocationName && !hasCoordinates) {
        return 'Provide a location name manually or allow device location access.';
    }

    if ((normalizedLat !== null || normalizedLng !== null) && !hasCoordinates) {
        return 'Invalid location coordinates provided.';
    }

    if (normalizedLocationSource === 'manual' && !hasManualLocationName && !hasCoordinates) {
        return 'Manual reports must include a location name or map pin.';
    }

    if (normalizedLocationSource === 'device' && !hasCoordinates) {
        return 'Device location reports must include valid coordinates.';
    }

    if (parsedAccuracy !== null && parsedAccuracy < 0) {
        return 'Location accuracy must be a positive number.';
    }

    if (!ITEM_CATEGORIES.includes(category)) {
        return 'Invalid category.';
    }

    return null;
};

const buildLocationData = ({
    normalizedLocationName,
    normalizedLat,
    normalizedLng,
    hasCoordinates,
    normalizedLocationSource,
    parsedAccuracy,
}) => ({
    name: normalizedLocationName || (hasCoordinates ? buildCoordinateLabel(normalizedLat, normalizedLng) : ''),
    coordinates: hasCoordinates
        ? {
            type: 'Point',
            coordinates: [normalizedLng, normalizedLat],
        }
        : undefined,
    source: normalizedLocationSource,
    accuracy: parsedAccuracy ?? null,
    capturedAt: hasCoordinates ? new Date() : null,
});

const buildItemImageData = (imageData) => ({
    url: imageData?.image_url || null,
    base64: imageData?.image_base64 || null,
});

const createItem = async (req, res) => {
    try {
        const io = req.app.get('io');
        const payload = extractItemPayload(req.body);
        const validationError = validateItemPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        if (!req.user?._id) {
            return res.status(401).json({ message: 'Not authorized, no user found for item creation.' });
        }

        const userRole = normalizeRole(req.user.role);
        const canReport = [USER_ROLES.USER, USER_ROLES.ADMIN].includes(userRole);

        if (!canReport) {
            return res.status(403).json({ message: 'You do not have permission to report items.' });
        }

        const imageData = await processItemImage({
            fileBuffer: req.file?.buffer,
            base64Value: req.body.image_base64,
        });

        const item = await Item.create({
            type: payload.type,
            title: payload.title,
            description: payload.description,
            category: payload.category,
            location: buildLocationData(payload),
            urgency: payload.urgency || 'Normal',
            isAnonymous: payload.isAnonymous || false,
            image: buildItemImageData(imageData),
            reportedBy: req.user._id,
            reportedAt: payload.reportedAt || payload.eventDate || undefined,
        });

        const populatedItem = await Item.findById(item._id).populate('reportedBy', 'name email role').lean();

        if (io) {
            io.to('feed').emit('newItem', {
                item: populatedItem,
                message:
                    item.type === 'lost'
                        ? 'New lost item reported near you!'
                        : 'New found item reported near you!',
                timestamp: new Date().toISOString(),
            });

            io.to('admin').emit('newItem', {
                item: populatedItem,
                timestamp: new Date().toISOString(),
            });
        }

        matchItem(item, io).catch((error) => {
            console.error('Matching pipeline error:', error);
        });

        res.status(201).json({ success: true, item: populatedItem });
    } catch (error) {
        console.error('createItem error:', error);
        res.status(500).json({ message: error.message || 'Failed to create item.' });
    }
};

const getItems = async (req, res) => {
    try {
        const {
            status = 'open',
            type,
            category,
            limit = 20,
            page = 1,
            sort = '-reportedAt',
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (category) filter.category = category;

        const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
        const parsedPage = Math.max(1, Number(page) || 1);

        const [items, total] = await Promise.all([
            Item.find(filter)
                .populate('reportedBy', 'name email role')
                .sort(sort)
                .limit(parsedLimit)
                .skip((parsedPage - 1) * parsedLimit)
                .lean(),
            Item.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            items,
            total,
            pages: Math.ceil(total / parsedLimit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch feed items.' });
    }
};

const getMyItems = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const items = await Item.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1, reportedAt: -1 })
            .lean();

        const itemIds = items.map((item) => item._id);
        const [matchCounts, reunitedCount] = await Promise.all([
            itemIds.length > 0
                ? Match.countDocuments({
                    $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }],
                    status: 'pending',
                })
                : 0,
            Item.countDocuments({
                reportedBy: req.user._id,
                status: 'matched',
            }),
        ]);

        res.status(200).json({
            success: true,
            count: items.length,
            items,
            stats: {
                activeReports: items.filter((item) => item.status === 'open').length,
                potentialMatches: matchCounts,
                itemsReunited: reunitedCount,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch your items.' });
    }
};

const getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('reportedBy', 'name email role');

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ success: true, item });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch item.' });
    }
};

const getItemMatches = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const matches = await Match.find({
            $or: [{ lostItem: item._id }, { foundItem: item._id }],
            'scores.final': { $gte: 35 },
        })
            .populate('lostItem', 'title description category location image reportedAt')
            .populate('foundItem', 'title description category location image reportedAt')
            .sort({ 'scores.final': -1, createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: matches.length, matches });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch matches.' });
    }
};

const runItemMatching = async (req, res) => {
    try {
        const results = await rerunMatchForItem(req.params.id);
        res.status(200).json({ success: true, matchesFound: results.length, results });
    } catch (error) {
        const status = error.message === 'Item not found' ? 404 : 500;
        res.status(status).json({ message: error.message || 'Failed to run matching.' });
    }
};

const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        const userRole = normalizeRole(req.user.role);
        if (item.reportedBy.toString() !== req.user._id.toString() && userRole !== USER_ROLES.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        const payload = extractItemPayload(req.body);
        const validationError = validateItemPayload(payload);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const previousImageUrl = item.image?.url || null;
        const hasNewImageUpload = Boolean(req.file?.buffer || req.body.image_base64);
        const nextImage = hasNewImageUpload
            ? buildItemImageData(await processItemImage({
                fileBuffer: req.file?.buffer,
                base64Value: req.body.image_base64,
            }))
            : item.image;

        item.type = payload.type;
        item.title = payload.title;
        item.description = payload.description;
        item.category = payload.category;
        item.location = buildLocationData(payload);
        item.urgency = payload.type === 'lost' ? (payload.urgency || item.urgency || 'Normal') : 'Normal';
        item.isAnonymous = payload.type === 'found' ? Boolean(payload.isAnonymous) : false;
        item.image = nextImage;
        item.reportedAt = payload.reportedAt || payload.eventDate || item.reportedAt;
        item.markModified('location');
        item.markModified('image');

        await item.save();

        if (hasNewImageUpload && previousImageUrl && previousImageUrl !== item.image?.url) {
            try {
                await deleteUploadedImage(previousImageUrl);
            } catch (cleanupError) {
                console.error('Failed to remove replaced item image:', cleanupError);
            }
        }

        const updatedItem = await Item.findById(req.params.id).populate('reportedBy', 'name email role');

        res.status(200).json({ success: true, item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update item.' });
    }
};

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        const userRole = normalizeRole(req.user.role);
        if (item.reportedBy.toString() !== req.user._id.toString() && userRole !== USER_ROLES.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        // Clean up Matches (Optional but recommended so they don't linger)
        await Match.deleteMany({ $or: [{ lostItem: item._id }, { foundItem: item._id }] });
        await item.deleteOne();

        res.status(200).json({ success: true, message: 'Item removed', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete item.' });
    }
};

module.exports = {
    createItem,
    getItems,
    getMyItems,
    getItem,
    getItemMatches,
    runItemMatching,
    updateItem,
    deleteItem,
};
