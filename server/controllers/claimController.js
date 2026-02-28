const Claim = require('../models/Claim');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

// @desc    Submit a new claim
// @route   POST /api/claims
// @access  Private
const submitClaim = async (req, res) => {
    try {
        const { itemId, itemType, proofImage, explanation } = req.body;

        if (!itemId || !itemType || !proofImage || !explanation) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Verify item exists
        let item;
        if (itemType === 'LostItem') {
            item = await LostItem.findById(itemId);
        } else {
            item = await FoundItem.findById(itemId);
        }

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Ensure they aren't claiming their own item
        if (item.postedBy.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot claim your own post' });
        }

        // Check if user already has an active claim for this item
        const existingClaim = await Claim.findOne({
            itemId,
            claimant: req.user.id,
            status: { $in: ['pending', 'under_review'] }
        });

        if (existingClaim) {
            return res.status(400).json({ message: 'You already have an active claim for this item' });
        }

        const claim = await Claim.create({
            itemId,
            itemType,
            claimant: req.user.id,
            proofImage,
            explanation,
        });

        // We can emit socket notification here if we had `io` accessible
        // For now we'll just handle it at DB level and emit from frontend

        res.status(201).json(claim);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get claims for user (either as claimant or owner)
// @route   GET /api/claims
// @access  Private
const getClaims = async (req, res) => {
    try {
        // Claims where user is the claimant
        const myClaims = await Claim.find({ claimant: req.user.id })
            .populate('itemId')
            .sort({ createdAt: -1 });

        // Claims on items owned by the user
        const myLostItems = await LostItem.find({ postedBy: req.user.id }).select('_id');
        const myFoundItems = await FoundItem.find({ postedBy: req.user.id }).select('_id');

        const itemIds = [
            ...myLostItems.map(item => item._id),
            ...myFoundItems.map(item => item._id)
        ];

        const receivedClaims = await Claim.find({ itemId: { $in: itemIds } })
            .populate('claimant', 'name email')
            .populate('itemId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            myClaims,
            receivedClaims
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update claim status (approve/reject)
// @route   PUT /api/claims/:id/status
// @access  Private
const updateClaimStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const claim = await Claim.findById(req.params.id)
            .populate('itemId', 'postedBy status');

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        // Ensure user updating is the owner of the item
        let isOwner = false;
        let ItemModel;

        if (claim.itemType === 'LostItem') {
            const item = await LostItem.findById(claim.itemId);
            if (item && item.postedBy.toString() === req.user.id) {
                isOwner = true;
                ItemModel = LostItem;
            }
        } else {
            const item = await FoundItem.findById(claim.itemId);
            if (item && item.postedBy.toString() === req.user.id) {
                isOwner = true;
                ItemModel = FoundItem;
            }
        }

        if (!isOwner && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to update this claim' });
        }

        // Check expiration rule (48 hours)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        if (claim.status === 'pending' && claim.createdAt < fortyEightHoursAgo) {
            claim.status = 'expired';
            await claim.save();
            return res.status(400).json({ message: 'This claim has expired due to 48 hours of inactivity' });
        }

        claim.status = status;
        await claim.save();

        // If approved, update item status to claimed
        if (status === 'approved') {
            await ItemModel.findByIdAndUpdate(claim.itemId, { status: claim.itemType === 'LostItem' ? 'claimed' : 'handed_over' });
        }

        res.status(200).json(claim);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single claim (e.g for chat)
// @route   GET /api/claims/:id
// @access  Private
const getClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate('claimant', 'name email')
            .populate('itemId');

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        // Simple auth check to ensure only involved parties see this claim
        let isOwnerOrAdmin = req.user.role === 'admin' || claim.claimant._id.toString() === req.user.id;
        if (!isOwnerOrAdmin) {
            // check if req.user is the owner of the item
            const ItemModel = claim.itemType === 'LostItem' ? LostItem : FoundItem;
            const item = await ItemModel.findById(claim.itemId._id);
            if (item && item.postedBy.toString() === req.user.id) {
                isOwnerOrAdmin = true;
            }
        }

        if (!isOwnerOrAdmin) {
            return res.status(401).json({ message: 'Not authorized to view this claim' });
        }

        res.status(200).json(claim);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    submitClaim,
    getClaims,
    updateClaimStatus,
    getClaim
};
