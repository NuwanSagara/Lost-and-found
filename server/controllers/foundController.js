const FoundItem = require('../models/FoundItem');
const { USER_ROLES, normalizeRole } = require('../middleware/authMiddleware');

// @desc    Get all found items (active only by default)
// @route   GET /api/found
// @access  Public
const getFoundItems = async (req, res) => {
    try {
        const items = await FoundItem.find({ status: 'active' })
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single found item
// @route   GET /api/found/:id
// @access  Public
const getFoundItem = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id).populate(
            'postedBy',
            'name email'
        );
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Report found item
// @route   POST /api/found
// @access  Private
const createFoundItem = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in again before posting an item' });
        }

        const {
            title,
            category,
            description,
            location,
            dateFound,
            image,
            isAnonymous,
        } = req.body;

        if (!title || !category || !description || !location || !dateFound || !image) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const item = await FoundItem.create({
            title,
            category,
            description,
            location,
            dateFound,
            image,
            isAnonymous: isAnonymous || false,
            postedBy: req.user.id,
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update found item
// @route   PUT /api/found/:id
// @access  Private
const updateFoundItem = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check ownership
        if (item.postedBy.toString() !== req.user.id && normalizeRole(req.user.role) !== USER_ROLES.ADMIN) {
            return res.status(401).json({ message: 'User not authorized to update' });
        }

        const updatedItem = await FoundItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete found item
// @route   DELETE /api/found/:id
// @access  Private
const deleteFoundItem = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check ownership
        if (item.postedBy.toString() !== req.user.id && normalizeRole(req.user.role) !== USER_ROLES.ADMIN) {
            return res.status(401).json({ message: 'User not authorized to delete' });
        }

        await item.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFoundItems,
    getFoundItem,
    createFoundItem,
    updateFoundItem,
    deleteFoundItem,
};
