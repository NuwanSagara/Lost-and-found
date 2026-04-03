const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Item',
        },
        itemType: {
            type: String,
            required: true,
            enum: ['lost', 'found'],
        },
        claimant: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^\d{10}$/, 'Phone number must contain exactly 10 digits'],
        },
        proofImage: {
            type: String,
            default: '',
        },
        explanation: {
            type: String,
            required: [true, 'Please provide a detailed explanation'],
            trim: true,
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

module.exports = mongoose.models.Claim || mongoose.model('Claim', claimSchema);
