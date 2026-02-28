const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'itemType',
        },
        itemType: {
            type: String,
            required: true,
            enum: ['LostItem', 'FoundItem'],
        },
        claimant: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        proofImage: {
            type: String,
            required: [true, 'Proof photo is mandatory'],
        },
        explanation: {
            type: String,
            required: [true, 'Please provide a detailed explanation'],
        },
        status: {
            type: String,
            enum: ['pending', 'under_review', 'approved', 'rejected', 'completed', 'expired'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Business Rule: claim expires after 48 hours. Let's handle expiration via a cron or check-on-read.
// For now, we'll store createdAt implicitly via timestamps

module.exports = mongoose.model('Claim', claimSchema);
