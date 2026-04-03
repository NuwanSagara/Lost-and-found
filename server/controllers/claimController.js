const Claim = require('../models/Claim');
const { Item } = require('../models/Item');
const { USER_ROLES, normalizeRole } = require('../middleware/authMiddleware');

const submitClaim = async (req, res) => {
    try {
        const { itemId, proofImage, explanation, phoneNumber } = req.body;

        if (!itemId || !explanation || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (!/^\d{10}$/.test(String(phoneNumber))) {
            return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.type !== 'found') {
            return res.status(400).json({ message: 'Claims can only be submitted for found item reports' });
        }

        if (item.reportedBy.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot claim your own post' });
        }

        const existingClaim = await Claim.findOne({
            itemId,
            claimant: req.user.id,
            status: { $in: ['pending', 'under_review'] },
        });

        if (existingClaim) {
            return res.status(400).json({ message: 'You already have an active claim for this item' });
        }

        const claim = await Claim.create({
            itemId,
            itemType: item.type,
            claimant: req.user.id,
            phoneNumber: String(phoneNumber),
            proofImage: proofImage || '',
            explanation: String(explanation).trim(),
        });

        const populatedClaim = await Claim.findById(claim._id)
            .populate('claimant', 'name email role')
            .populate('itemId');

        return res.status(201).json(populatedClaim);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to submit claim' });
    }
};

const getClaims = async (req, res) => {
    try {
        const isAdminSecurity = normalizeRole(req.user.role) === USER_ROLES.ADMIN;

        if (isAdminSecurity) {
            const allClaims = await Claim.find({})
                .populate('claimant', 'name email role')
                .populate('itemId')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                myClaims: allClaims,
                receivedClaims: allClaims,
            });
        }

        const myClaims = await Claim.find({ claimant: req.user.id })
            .populate('itemId')
            .sort({ createdAt: -1 });

        const myItems = await Item.find({ reportedBy: req.user.id }).select('_id');
        const itemIds = myItems.map((item) => item._id);

        const receivedClaims = await Claim.find({ itemId: { $in: itemIds } })
            .populate('claimant', 'name email')
            .populate('itemId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            myClaims,
            receivedClaims,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch claims' });
    }
};

const updateClaimStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const claim = await Claim.findById(req.params.id).populate('itemId');

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        const item = await Item.findById(claim.itemId?._id || claim.itemId);
        const isOwner = item && item.reportedBy.toString() === req.user.id;

        if (!isOwner && normalizeRole(req.user.role) !== USER_ROLES.ADMIN) {
            return res.status(401).json({ message: 'Not authorized to update this claim' });
        }

        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        if (claim.status === 'pending' && claim.createdAt < fortyEightHoursAgo) {
            claim.status = 'expired';
            await claim.save();
            return res.status(400).json({ message: 'This claim has expired due to 48 hours of inactivity' });
        }

        claim.status = status;
        await claim.save();

        if (status === 'approved' && item) {
            await Item.findByIdAndUpdate(item._id, { status: 'matched' });
        }

        return res.status(200).json(claim);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update claim' });
    }
};

const getClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate('claimant', 'name email')
            .populate('itemId');

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        let isOwnerOrAdmin =
            normalizeRole(req.user.role) === USER_ROLES.ADMIN ||
            claim.claimant._id.toString() === req.user.id;

        if (!isOwnerOrAdmin) {
            const item = await Item.findById(claim.itemId?._id || claim.itemId);
            if (item && item.reportedBy.toString() === req.user.id) {
                isOwnerOrAdmin = true;
            }
        }

        if (!isOwnerOrAdmin) {
            return res.status(401).json({ message: 'Not authorized to view this claim' });
        }

        return res.status(200).json(claim);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch claim' });
    }
};

const updateClaim = async (req, res) => {
    try {
        const { explanation, phoneNumber, proofImage } = req.body;
        const claim = await Claim.findById(req.params.id).populate('itemId');

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        const isAdmin = normalizeRole(req.user.role) === USER_ROLES.ADMIN;
        const isClaimant = claim.claimant.toString() === req.user.id;

        if (!isClaimant && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to update this claim' });
        }

        if (!explanation || !String(explanation).trim()) {
            return res.status(400).json({ message: 'Please provide a detailed explanation' });
        }

        if (!/^\d{10}$/.test(String(phoneNumber || ''))) {
            return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
        }

        claim.explanation = String(explanation).trim();
        claim.phoneNumber = String(phoneNumber);
        claim.proofImage = proofImage || '';

        await claim.save();

        const updatedClaim = await Claim.findById(claim._id)
            .populate('claimant', 'name email role')
            .populate('itemId');

        return res.status(200).json(updatedClaim);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update claim' });
    }
};

const deleteClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        const isAdmin = normalizeRole(req.user.role) === USER_ROLES.ADMIN;
        const isClaimant = claim.claimant.toString() === req.user.id;

        if (!isClaimant && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to delete this claim' });
        }

        await claim.deleteOne();

        return res.status(200).json({ success: true, id: req.params.id });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to delete claim' });
    }
};

module.exports = {
    submitClaim,
    getClaims,
    updateClaimStatus,
    getClaim,
    updateClaim,
    deleteClaim,
};
