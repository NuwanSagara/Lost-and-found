const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const stringSimilarity = require('string-similarity');

// @desc    Search and get smart matches
// @route   GET /api/search
// @access  Public
const searchItems = async (req, res) => {
    try {
        const { query, category, location, status, type } = req.query;

        let filter = {};

        if (category) filter.category = category;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (status) filter.status = status;
        else filter.status = 'active';

        let lostResult = [];
        let foundResult = [];

        if (!type || type === 'lost') {
            let lostQuery = { ...filter };
            if (query) {
                lostQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                ];
            }
            lostResult = await LostItem.find(lostQuery).populate('postedBy', 'name');
        }

        if (!type || type === 'found') {
            let foundQuery = { ...filter };
            if (query) {
                foundQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                ];
            }
            foundResult = await FoundItem.find(foundQuery).populate('postedBy', 'name');
        }

        res.status(200).json({
            lost: lostResult,
            found: foundResult,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get smart matches for a specific item
// @route   GET /api/search/match/:type/:id
// @access  Private
const getMatches = async (req, res) => {
    try {
        const { type, id } = req.params;
        let sourceItem, matchCandidates;

        if (type === 'lost') {
            sourceItem = await LostItem.findById(id);
            if (!sourceItem) return res.status(404).json({ message: 'Lost item not found' });
            // Find active found items matching category
            matchCandidates = await FoundItem.find({
                status: 'active',
                // Pre-filter by roughly same timeframe
                createdAt: { $gte: new Date(sourceItem.createdAt).setDate(new Date(sourceItem.createdAt).getDate() - 30) }
            });
        } else if (type === 'found') {
            sourceItem = await FoundItem.findById(id);
            if (!sourceItem) return res.status(404).json({ message: 'Found item not found' });
            // Find active lost items
            matchCandidates = await LostItem.find({
                status: 'active',
                createdAt: { $gte: new Date(sourceItem.createdAt).setDate(new Date(sourceItem.createdAt).getDate() - 30) }
            });
        } else {
            return res.status(400).json({ message: 'Invalid type. Use "lost" or "found"' });
        }

        // Calculate match scores
        const scoredMatches = matchCandidates.map((candidate) => {
            let score = 0;

            // Category match (+40%)
            if (candidate.category === sourceItem.category) {
                score += 40;
            }

            // Location match roughly (+30%)
            const locSimilarity = stringSimilarity.compareTwoStrings(
                sourceItem.location.toLowerCase(),
                candidate.location.toLowerCase()
            );
            if (locSimilarity > 0.6) {
                score += 30;
            } else if (locSimilarity > 0.3) {
                score += 15;
            }

            // Keyword similarity in title/description (+30%)
            const sourceText = `${sourceItem.title} ${sourceItem.description}`.toLowerCase();
            const candidateText = `${candidate.title} ${candidate.description}`.toLowerCase();
            const textSimilarity = stringSimilarity.compareTwoStrings(sourceText, candidateText);

            score += Math.round(textSimilarity * 30);

            return {
                item: candidate,
                score,
            };
        });

        // Sort by score desc and take top 5 with score > 20
        const topMatches = scoredMatches
            .filter((m) => m.score >= 20)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        res.status(200).json(topMatches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchItems,
    getMatches,
};
