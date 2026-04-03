const mongoose = require('mongoose');

const ITEM_CATEGORIES = [
    'Electronics',
    'Phone',
    'Laptop',
    'Earbuds',
    'Tablet',
    'Bag',
    'Backpack',
    'Wallet',
    'Keys',
    'Clothing',
    'Jewelry',
    'ID Card',
    'Book',
    'Other',
];

const itemSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['lost', 'found'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 120,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: ITEM_CATEGORIES,
            required: true,
        },
        location: {
            name: {
                type: String,
                trim: true,
                default: '',
                maxlength: 160,
            },
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: undefined,
                },
                coordinates: {
                    type: [Number],
                    default: undefined,
                    validate: {
                        validator(value) {
                            if (value === undefined || value === null || value.length === 0) {
                                return true;
                            }

                            if (!Array.isArray(value) || value.length !== 2) {
                                return false;
                            }

                            const [lng, lat] = value;
                            return (
                                typeof lat === 'number' &&
                                typeof lng === 'number' &&
                                lat >= -90 &&
                                lat <= 90 &&
                                lng >= -180 &&
                                lng <= 180
                            );
                        },
                        message: 'Location coordinates must contain valid longitude and latitude values.',
                    },
                },
            },
            source: {
                type: String,
                enum: ['manual', 'device'],
                default: 'manual',
            },
            accuracy: {
                type: Number,
                default: null,
            },
            capturedAt: {
                type: Date,
                default: null,
            },
        },
        image: {
            url: {
                type: String,
                default: null,
            },
            base64: {
                type: String,
                default: null,
            },
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['open', 'matched', 'closed', 'recovered'],
            default: 'open',
        },
        urgency: {
            type: String,
            enum: ['Normal', 'Important', 'Emergency'],
            default: 'Normal',
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        reportedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

itemSchema.index({ 'location.coordinates': '2dsphere' });
itemSchema.index({ type: 1, status: 1, category: 1, reportedAt: -1 });

module.exports = {
    Item: mongoose.models.Item || mongoose.model('Item', itemSchema),
    ITEM_CATEGORIES,
};
