const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        expiryDays: {
            type: Number,
            default: 30,
        },
        supportedCategories: {
            type: [String],
            default: ['Electronics', 'Bags', 'Keys', 'Wallets', 'Phones', 'Clothing', 'Jewelry', 'Other'],
        },
        enableNotifications: {
            type: Boolean,
            default: true,
        },
        enableLostReporting: {
            type: Boolean,
            default: true,
        },
        enableFoundReporting: {
            type: Boolean,
            default: true,
        },
        storageLocations: {
            type: [String],
            default: ['Security Office', 'Lost & Found Desk', 'IT Helpdesk', 'Department Office'],
        },
    },
    {
        timestamps: true,
    }
);

settingsSchema.statics.getGlobalSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
