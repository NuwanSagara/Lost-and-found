const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
        },
        email: {
            type: String,
            required: [true, 'Please provide a university email'],
            unique: true,
            match: [/.+@.+\.edu$/, 'Please provide a valid university email (ends with .edu)'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 6,
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
