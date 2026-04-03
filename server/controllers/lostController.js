const LostItem = require('../models/LostItem');
const { USER_ROLES, normalizeRole } = require('../middleware/authMiddleware');

// @desc    Get all lost items (active only)
// @route   GET /api/lost
// @access  Public
const getLostItems = async (req, res) => {
    try {
        const items = await LostItem.find({ status: 'active' })
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single lost item
// @route   GET /api/lost/:id
// @access  Public
const getLostItem = async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id).populate(
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

// @desc    Create lost item
// @route   POST /api/lost
// @access  Private
const createLostItem = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in again before posting an item' });
        }

        const { title, category, description, location, dateLost, image, urgency } =
            req.body;

        if (!title || !category || !description || !location || !dateLost || !image) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const item = await LostItem.create({
            title,
            category,
            description,
            location,
            dateLost,
            image,
            urgency: urgency || 'Normal',
            postedBy: req.user.id,
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update lost item
// @route   PUT /api/lost/:id
// @access  Private
const updateLostItem = async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if user is the owner
        if (item.postedBy.toString() !== req.user.id && normalizeRole(req.user.role) !== USER_ROLES.ADMIN) {
            return res.status(401).json({ message: 'User not authorized to update' });
        }

        // Check if within 7 days (Business Rule)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (item.createdAt < sevenDaysAgo) {
            return res.status(400).json({ message: 'Cannot edit posts older than 7 days' });
        }

        const updatedItem = await LostItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete lost item
// @route   DELETE /api/lost/:id
// @access  Private
const deleteLostItem = async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if user is owner
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
    getLostItems,
    getLostItem,
    createLostItem,
    updateLostItem,
    deleteLostItem,
};
