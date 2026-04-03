const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
        },
        category: {
            type: String,
            required: [true, 'Please select a category'],
            enum: ['Phone', 'Wallet', 'ID', 'Laptop', 'Bag', 'Other'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        location: {
            type: String,
            required: [true, 'Please add the last seen location'],
        },
        dateLost: {
            type: Date,
            required: [true, 'Please add the date lost'],
        },
        image: {
            type: String,
            required: [true, 'Photo is mandatory'],
        },
        urgency: {
            type: String,
            enum: ['Normal', 'High'],
            default: 'Normal',
        },
        status: {
            type: String,
            enum: ['active', 'claimed', 'archived'],
            default: 'active',
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('LostItem', lostItemSchema);
