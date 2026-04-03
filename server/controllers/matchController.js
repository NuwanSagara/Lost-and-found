const { callClaudeImageMatch, callClaudeTextMatch } = require('../services/matching/claude');
const Match = require('../models/Match');
const { Item } = require('../models/Item');

const postTextMatch = async (req, res) => {
    try {
        const { lostDescription, foundDescription } = req.body;
        const result = await callClaudeTextMatch(lostDescription, foundDescription);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Text matching failed.' });
    }
};

const postImageMatch = async (req, res) => {
    try {
        const { lostImageBase64, foundImageBase64 } = req.body;
        const result = await callClaudeImageMatch(lostImageBase64, foundImageBase64);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Image matching failed.' });
    }
};

const confirmMatch = async (req, res) => {
    try {
        const io = req.app.get('io');
        const { adminNotes = '' } = req.body || {};
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            {
                status: 'confirmed',
                confirmedAt: new Date(),
                rejectedAt: null,
                rejectedBy: null,
                confirmedBy: req.user?._id || null,
                adminNotes,
            },
            { new: true }
        ).populate('lostItem foundItem');

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        await Item.updateMany(
            { _id: { $in: [match.lostItem, match.foundItem] } },
            { $set: { status: 'matched' } }
        );

        if (io) {
            io.to('admin').emit('matchConfirmed', {
                matchId: match._id,
                timestamp: new Date().toISOString(),
            });
        }

        res.status(200).json({ success: true, match });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to confirm match.' });
    }
};

const rejectMatch = async (req, res) => {
    try {
        const { adminNotes = '' } = req.body || {};
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectedAt: new Date(),
                confirmedAt: null,
                confirmedBy: null,
                rejectedBy: req.user?._id || null,
                adminNotes,
            },
            { new: true }
        );

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        res.status(200).json({ success: true, match });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to reject match.' });
    }
};

const getPendingMatches = async (req, res) => {
    try {
        const matches = await Match.find({ status: 'pending' })
            .populate('lostItem', 'title category location reportedAt image')
            .populate('foundItem', 'title category location reportedAt image')
            .sort({ 'scores.final': -1, createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: matches.length, matches });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch pending matches.' });
    }
};

module.exports = {
    postTextMatch,
    postImageMatch,
    confirmMatch,
    rejectMatch,
    getPendingMatches,
};
