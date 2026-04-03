const { User, USER_ROLES, normalizeRole } = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { reverseGeocodeCoordinates } = require('../utils/reverseGeocode');

// Generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: normalizeRole(user.role) }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const ACCOUNT_TYPES = {
    NORMAL_USER: 'NORMAL_USER',
    ADMIN: 'ADMIN',
};

const getRedirectPath = (role) => (
    role === USER_ROLES.ADMIN ? '/admin' : '/user/dashboard'
);

const normalizeCoordinate = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const isValidLatitude = (value) => typeof value === 'number' && value >= -90 && value <= 90;
const isValidLongitude = (value) => typeof value === 'number' && value >= -180 && value <= 180;

const serializeLocation = (location) => {
    if (
        !location ||
        (
            typeof location.latitude !== 'number' &&
            typeof location.longitude !== 'number' &&
            !location.formattedAddress &&
            !location.address
        )
    ) {
        return null;
    }

    return {
        latitude: typeof location.latitude === 'number' ? location.latitude : null,
        longitude: typeof location.longitude === 'number' ? location.longitude : null,
        accuracy: typeof location.accuracy === 'number' ? location.accuracy : null,
        address: location.address || '',
        city: location.city || '',
        country: location.country || '',
        formattedAddress: location.formattedAddress || '',
        source: location.source || 'device',
        capturedAt: location.capturedAt || null,
    };
};

const serializeUser = (user, token = null) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    avatar: user.avatar || '',
    location: serializeLocation(user.location),
    token: token || undefined,
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, studentId, university } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const requestedRole = USER_ROLES.CAMPUS_MEMBER;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            studentId: studentId || '',
            university: university || undefined,
            role: requestedRole,
        });

        if (user) {
            const io = req.app.get('io');
            if (io) {
                io.to('admin').emit('newUser', {
                    user: {
                        _id: user.id,
                        name: user.name,
                        email: user.email,
                        role: normalizeRole(user.role),
                    },
                });
            }

            res.status(201).json({
                ...serializeUser(user, generateToken(user)),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password, accountType } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedAccountType = accountType === ACCOUNT_TYPES.ADMIN
            ? ACCOUNT_TYPES.ADMIN
            : ACCOUNT_TYPES.NORMAL_USER;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await bcrypt.compare(password, user.password))) {
            const normalizedRole = normalizeRole(user.role);

            if (user.status === 'suspended') {
                return res.status(403).json({ message: 'This account is suspended. Please contact campus security.' });
            }

            if (normalizedAccountType === ACCOUNT_TYPES.ADMIN && normalizedRole !== USER_ROLES.ADMIN) {
                return res.status(403).json({ message: 'This account is not authorized for admin login.' });
            }

            if (normalizedAccountType === ACCOUNT_TYPES.NORMAL_USER && normalizedRole === USER_ROLES.ADMIN) {
                return res.status(403).json({ message: 'Admin accounts must sign in using the Admin account type.' });
            }

            await User.findByIdAndUpdate(user._id, { $set: { lastLoginAt: new Date() } });

            res.json({
                ...serializeUser(user, generateToken(user)),
                role: normalizedRole,
                redirectTo: getRedirectPath(normalizedRole),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        res.status(200).json({ ...req.user.toObject(), role: normalizeRole(req.user.role) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMyLocation = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const latitude = normalizeCoordinate(req.body.latitude ?? req.body.lat);
        const longitude = normalizeCoordinate(req.body.longitude ?? req.body.lng);
        const accuracy = normalizeCoordinate(req.body.accuracy);

        if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
            return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
        }

        if (accuracy !== null && accuracy < 0) {
            return res.status(400).json({ message: 'Location accuracy must be a positive number.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let geocoded = null;
        try {
            geocoded = await reverseGeocodeCoordinates({ latitude, longitude });
        } catch (error) {
            console.error('Reverse geocoding failed:', error.message);
        }

        const formattedAddress = geocoded?.formattedAddress || req.body.formattedAddress || req.body.address || '';
        const city = geocoded?.city || req.body.city || '';
        const country = geocoded?.country || req.body.country || '';
        const address = geocoded?.address || req.body.address || formattedAddress;

        user.location = {
            latitude,
            longitude,
            accuracy,
            address,
            city,
            country,
            formattedAddress,
            source: 'device',
            capturedAt: req.body.capturedAt ? new Date(req.body.capturedAt) : new Date(),
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Location saved successfully.',
            location: serializeLocation(user.location),
            user: serializeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to save location.' });
    }
};

const updateAvatar = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a profile image.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        const previousAvatar = user.avatar;

        user.avatar = avatarPath;
        await user.save();

        if (previousAvatar && previousAvatar.startsWith('/uploads/avatars/')) {
            const previousFilePath = path.join(__dirname, '..', previousAvatar.replace(/^\/+/, ''));
            if (previousFilePath !== req.file.path) {
                fs.promises.unlink(previousFilePath).catch(() => {});
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully.',
            user: serializeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update profile picture.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateMyLocation,
    updateAvatar,
    ACCOUNT_TYPES,
};
