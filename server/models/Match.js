const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
    {
        lostItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true,
        },
        foundItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true,
        },
        scores: {
            text: {
                type: Number,
                default: 0,
            },
            image: {
                type: Number,
                default: null,
            },
            meta: {
                type: Number,
                default: 0,
            },
            final: {
                type: Number,
                default: 0,
            },
        },
        label: {
            type: String,
            enum: ['Strong Match', 'Possible Match', 'Weak Match', 'Unlikely Match'],
        },
        ai: {
            textReason: {
                type: String,
                default: '',
            },
            imageReason: {
                type: String,
                default: '',
            },
            keyMatches: {
                type: [String],
                default: [],
            },
            visualMatches: {
                type: [String],
                default: [],
            },
            confidence: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'low',
            },
            fallback: {
                type: Boolean,
                default: false,
            },
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending',
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        adminNotes: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { timestamps: true }
);

matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchSchema.index({ lostItem: 1, 'scores.final': -1 });
matchSchema.index({ foundItem: 1, 'scores.final': -1 });

module.exports = mongoose.models.Match || mongoose.model('Match', matchSchema);
