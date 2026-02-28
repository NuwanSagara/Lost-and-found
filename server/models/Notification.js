const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String, // Optional URL to navigate to when clicked
        }
    },
    {
        timestamps: true,
    }
);

// Limit: Max 10 notifications per day per user handling will be added to the creation logic.

module.exports = mongoose.model('Notification', notificationSchema);
