const mongoose = require('mongoose');

const foundItemSchema = new mongoose.Schema(
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
            required: [true, 'Please add the found location'],
        },
        dateFound: {
            type: Date,
            required: [true, 'Please add the date found'],
        },
        image: {
            type: String,
            required: [true, 'Photo is mandatory'],
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['active', 'handed_over', 'claimed'],
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

module.exports = mongoose.model('FoundItem', foundItemSchema);
