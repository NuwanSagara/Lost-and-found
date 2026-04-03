const mongoose = require('mongoose');

const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
};

const ROLE_ALIASES = {
    student: USER_ROLES.USER,
    campus_member: USER_ROLES.USER,
    finder: USER_ROLES.USER,
    admin: USER_ROLES.ADMIN,
    admin_security: USER_ROLES.ADMIN,
    CAMPUS_MEMBER: USER_ROLES.USER,
    FINDER: USER_ROLES.USER,
    ADMIN: USER_ROLES.ADMIN,
    user: USER_ROLES.USER,
    USER: USER_ROLES.USER,
};

const normalizeRole = (role) => ROLE_ALIASES[role] || role || USER_ROLES.USER;

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
        studentId: {
            type: String,
            trim: true,
            default: '',
        },
        university: {
            type: String,
            default: 'Campus University',
            trim: true,
        },
        role: {
            type: String,
            enum: [
                USER_ROLES.USER,
                USER_ROLES.ADMIN,
                'student',
                'campus_member',
                'finder',
                'admin',
                'admin_security',
                'user',
                'CAMPUS_MEMBER',
                'FINDER',
                'ADMIN'
            ],
            default: USER_ROLES.USER,
        },
        avatar: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active',
        },
        suspendedAt: {
            type: Date,
            default: null,
        },
        suspendReason: {
            type: String,
            default: '',
            trim: true,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        location: {
            latitude: {
                type: Number,
                default: null,
                min: -90,
                max: 90,
            },
            longitude: {
                type: Number,
                default: null,
                min: -180,
                max: 180,
            },
            accuracy: {
                type: Number,
                default: null,
                min: 0,
            },
            address: {
                type: String,
                trim: true,
                default: '',
            },
            city: {
                type: String,
                trim: true,
                default: '',
            },
            country: {
                type: String,
                trim: true,
                default: '',
            },
            formattedAddress: {
                type: String,
                trim: true,
                default: '',
            },
            source: {
                type: String,
                enum: ['device', 'manual'],
                default: 'device',
            },
            capturedAt: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', function normalizeStoredRole() {
    this.role = normalizeRole(this.role);
});

module.exports = {
    User: mongoose.models.User || mongoose.model('User', userSchema),
    USER_ROLES,
    normalizeRole,
};
