const pLimitModule = require('p-limit');
const { Item } = require('../../models/Item');
const Match = require('../../models/Match');
const { sendMatchNotification } = require('../notifications');
const { callClaudeTextMatch, callClaudeImageMatch } = require('./claude');
const { combinedScore, metadataScore, relatedCategories } = require('./metadata');

const pLimit = pLimitModule.default || pLimitModule;
const limit = pLimit(5);

const labelFromFinal = (value) =>
    value >= 85 ? 'Strong Match' : value >= 60 ? 'Possible Match' : value >= 35 ? 'Weak Match' : 'Unlikely Match';

const fetchItemById = async (itemId) => Item.findById(itemId);

const matchItem = async (newItem, io = null) => {
    const sourceItem = typeof newItem.toObject === 'function' ? newItem.toObject() : newItem;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const candidates = await Item.find({
        type: { $ne: sourceItem.type },
        status: 'open',
        reportedAt: { $gte: thirtyDaysAgo },
        _id: { $ne: sourceItem._id },
    }).lean();

    const filtered = candidates.filter(
        (candidate) =>
            candidate.category === sourceItem.category ||
            relatedCategories(candidate.category, sourceItem.category)
    );

    if (filtered.length === 0) {
        return [];
    }

    const results = await Promise.all(
        filtered.map((candidate) =>
            limit(async () => {
                const hasImages = Boolean(sourceItem.image?.base64 && candidate.image?.base64);
                const [textResult, imageResult] = await Promise.all([
                    callClaudeTextMatch(sourceItem.description, candidate.description),
                    hasImages
                        ? callClaudeImageMatch(sourceItem.image.base64, candidate.image.base64)
                        : Promise.resolve(null),
                ]);

                const metaScore = metadataScore(sourceItem, candidate);
                const fallback = Boolean(textResult.fallback || imageResult?.fallback);
                const scored = fallback
                    ? { final: Math.round(metaScore * 10) / 10, label: labelFromFinal(metaScore) }
                    : combinedScore(Number(textResult.score) || 0, imageResult?.score ?? null, metaScore);

                return {
                    candidateId: candidate._id,
                    textScore: fallback ? 0 : Number(textResult.score) || 0,
                    imageScore: hasImages ? (fallback ? 0 : Number(imageResult?.score) || 0) : null,
                    metaScore,
                    final: scored.final,
                    label: scored.label,
                    textReason: fallback ? 'AI unavailable, used metadata-only scoring.' : textResult.reason,
                    imageReason: hasImages
                        ? fallback
                            ? 'AI unavailable, used metadata-only scoring.'
                            : imageResult?.reason || ''
                        : null,
                    keyMatches: fallback ? [] : textResult.key_matches || [],
                    visualMatches: fallback ? [] : imageResult?.visual_matches || [],
                    confidence: fallback ? 'low' : textResult.confidence || imageResult?.confidence || 'low',
                    fallback,
                };
            })
        )
    );

    const significant = results.filter((result) => result.final >= 35);

    await Promise.all(
        significant.map(async (result) => {
            const lostId = sourceItem.type === 'lost' ? sourceItem._id : result.candidateId;
            const foundId = sourceItem.type === 'found' ? sourceItem._id : result.candidateId;

            await Match.findOneAndUpdate(
                { lostItem: lostId, foundItem: foundId },
                {
                    $set: {
                        'scores.text': result.textScore,
                        'scores.image': result.imageScore,
                        'scores.meta': result.metaScore,
                        'scores.final': result.final,
                        label: result.label,
                        'ai.textReason': result.textReason,
                        'ai.imageReason': result.imageReason,
                        'ai.keyMatches': result.keyMatches,
                        'ai.visualMatches': result.visualMatches,
                        'ai.confidence': result.confidence,
                        'ai.fallback': result.fallback,
                        status: 'pending',
                    },
                    $unset: {
                        confirmedAt: 1,
                        rejectedAt: 1,
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            );
        })
    );

    if (io && significant.length > 0) {
        io.to('admin').emit('matchFound', {
            count: significant.length,
            timestamp: new Date().toISOString(),
        });
    }

    const strongMatches = significant.filter((result) => result.final >= 85);
    if (strongMatches.length > 0) {
        await sendMatchNotification(String(sourceItem.reportedBy), strongMatches);

        if (io) {
            io.to(`user:${String(sourceItem.reportedBy)}`).emit('matchFound', {
                itemId: sourceItem._id,
                count: strongMatches.length,
                topMatch: strongMatches[0],
                message: `We found ${strongMatches.length} possible match(es) for "${sourceItem.title}"!`,
            });

            for (const match of strongMatches) {
                const candidate = await Item.findById(match.candidateId).select('reportedBy title').lean();

                if (candidate?.reportedBy) {
                    io.to(`user:${String(candidate.reportedBy)}`).emit('matchFound', {
                        itemId: candidate._id,
                        count: 1,
                        topMatch: match,
                        message: `Someone may have found your "${candidate.title}"!`,
                    });
                }
            }
        }
    }

    return significant.sort((a, b) => b.final - a.final);
};

const rerunMatchForItem = async (itemId) => {
    const item = await fetchItemById(itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    return matchItem(item);
};

module.exports = {
    fetchItemById,
    matchItem,
    rerunMatchForItem,
};
