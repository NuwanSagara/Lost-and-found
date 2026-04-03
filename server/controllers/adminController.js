const { Item } = require('../models/Item');
const Match = require('../models/Match');
const { User, USER_ROLES, normalizeRole } = require('../models/User');
const AdminLog = require('../models/AdminLog');
const Settings = require('../models/Settings');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return parsed;
};

const ADMIN_CATEGORIES = ['Electronics', 'Bags', 'Keys', 'Wallets', 'Phones', 'Clothing', 'Jewelry', 'Other'];

const toAdminCategory = (category) => {
    const value = (category || '').toLowerCase();
    if (['electronics', 'laptop', 'tablet', 'earbuds', 'book', 'id card'].includes(value)) return 'Electronics';
    if (['bag', 'backpack', 'bags'].includes(value)) return 'Bags';
    if (value === 'keys') return 'Keys';
    if (value === 'wallet') return 'Wallets';
    if (value === 'phone') return 'Phones';
    if (value === 'clothing') return 'Clothing';
    if (value === 'jewelry') return 'Jewelry';
    return 'Other';
};

const getAdminStats = async (req, res) => {
    try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const olderThanWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalItems,
            openCases,
            pendingMatches,
            confirmedMatches,
            totalUsers,
            byCategoryRaw,
            lostCount,
            foundCount,
            itemsThisWeek,
            openOlderThanWeek,
            pendingToday,
        ] = await Promise.all([
            Item.countDocuments(),
            Item.countDocuments({ status: 'open' }),
            Match.countDocuments({ status: 'pending' }),
            Match.countDocuments({ status: 'confirmed' }),
            User.countDocuments(),
            Item.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Item.countDocuments({ type: 'lost' }),
            Item.countDocuments({ type: 'found' }),
            Item.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Item.countDocuments({ status: 'open', createdAt: { $lte: olderThanWeek } }),
            Match.countDocuments({ status: 'pending', createdAt: { $gte: todayStart } }),
        ]);

        const categoryCounts = ADMIN_CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
        byCategoryRaw.forEach((entry) => {
            const category = toAdminCategory(entry._id);
            categoryCounts[category] += entry.count;
        });

        const byCategory = ADMIN_CATEGORIES.map((category) => ({
            category,
            count: categoryCounts[category] || 0,
        }));

        const successRate = lostCount > 0 ? `${Math.round((confirmedMatches / lostCount) * 100)}%` : '0%';

        return res.status(200).json({
            totalItems,
            openCases,
            pendingMatches,
            confirmedMatches,
            totalUsers,
            itemsThisWeek,
            openOlderThanWeek,
            pendingToday,
            successRate,
            byCategory,
            lostCount,
            foundCount,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch admin stats.' });
    }
};

const getAdminActivity = async (req, res) => {
    try {
        const limit = Math.min(50, parsePositiveInt(req.query.limit, 10));
        const querySize = Math.max(limit * 2, 20);

        const [recentItems, recentMatches] = await Promise.all([
            Item.find({})
                .sort({ createdAt: -1 })
                .limit(querySize)
                .populate('reportedBy', 'name avatar role')
                .lean(),
            Match.find({})
                .sort({ createdAt: -1 })
                .limit(querySize)
                .populate({
                    path: 'lostItem',
                    select: 'title type reportedBy',
                    populate: { path: 'reportedBy', select: 'name avatar role' },
                })
                .populate({
                    path: 'foundItem',
                    select: 'title type reportedBy',
                    populate: { path: 'reportedBy', select: 'name avatar role' },
                })
                .populate('confirmedBy', 'name avatar role')
                .lean(),
        ]);

        const itemActivities = recentItems.map((item) => {
            const actor = item.reportedBy || { name: 'Unknown User', avatar: '', role: 'user' };
            return {
                type: 'item_reported',
                actor: {
                    name: actor.name || 'Unknown User',
                    avatar: actor.avatar || '',
                    role: normalizeRole(actor.role),
                },
                description: `${actor.name || 'Someone'} reported a ${item.type} ${item.title}`,
                itemType: item.type,
                timestamp: item.createdAt,
            };
        });

        const matchActivities = recentMatches.map((match) => {
            if (match.status === 'confirmed') {
                const actor = match.confirmedBy || { name: 'Admin', avatar: '', role: USER_ROLES.ADMIN };
                return {
                    type: 'match_confirmed',
                    actor: {
                        name: actor.name || 'Admin',
                        avatar: actor.avatar || '',
                        role: normalizeRole(actor.role),
                    },
                    description: `Match confirmed for ${match.lostItem?.title || 'lost item'} and ${match.foundItem?.title || 'found item'}`,
                    itemType: null,
                    timestamp: match.confirmedAt || match.updatedAt || match.createdAt,
                };
            }

            const actor = match.lostItem?.reportedBy || match.foundItem?.reportedBy || {
                name: 'System',
                avatar: '',
                role: USER_ROLES.ADMIN,
            };
            return {
                type: 'match_found',
                actor: {
                    name: actor.name || 'System',
                    avatar: actor.avatar || '',
                    role: normalizeRole(actor.role),
                },
                description: `New potential match between ${match.lostItem?.title || 'lost item'} and ${match.foundItem?.title || 'found item'}`,
                itemType: null,
                timestamp: match.createdAt,
            };
        });

        const activity = [...itemActivities, ...matchActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

        return res.status(200).json({ success: true, activity });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch activity feed.' });
    }
};

const buildMatchQuery = (query = {}) => {
    const filter = {};
    if (query.status && ['pending', 'confirmed', 'rejected'].includes(query.status)) {
        filter.status = query.status;
    }
    return filter;
};

const matchSortFromQuery = (sort = 'highest') => {
    if (sort === 'recent') {
        return { createdAt: -1 };
    }
    return { 'scores.final': -1, createdAt: -1 };
};

const getAdminMatches = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(50, parsePositiveInt(req.query.limit, 10));
        const filter = buildMatchQuery(req.query);
        const sort = matchSortFromQuery(req.query.sort);

        const [matches, total, pendingCount] = await Promise.all([
            Match.find(filter)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({
                    path: 'lostItem',
                    select: 'title category location reportedAt image reportedBy type status',
                    populate: { path: 'reportedBy', select: 'name avatar role email studentId' },
                })
                .populate({
                    path: 'foundItem',
                    select: 'title category location reportedAt image reportedBy type status',
                    populate: { path: 'reportedBy', select: 'name avatar role email studentId' },
                })
                .populate('confirmedBy', 'name email role')
                .populate('rejectedBy', 'name email role')
                .lean(),
            Match.countDocuments(filter),
            Match.countDocuments({ status: 'pending' }),
        ]);

        return res.status(200).json({
            success: true,
            matches,
            total,
            page,
            pages: Math.ceil(total / limit),
            pendingCount,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch admin matches.' });
    }
};

const getAdminMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate({
                path: 'lostItem',
                select: 'title description category location reportedAt image reportedBy type status',
                populate: { path: 'reportedBy', select: 'name avatar role email studentId university' },
            })
            .populate({
                path: 'foundItem',
                select: 'title description category location reportedAt image reportedBy type status',
                populate: { path: 'reportedBy', select: 'name avatar role email studentId university' },
            })
            .populate('confirmedBy', 'name email role')
            .populate('rejectedBy', 'name email role')
            .lean();

        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        return res.status(200).json({ success: true, match });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch match.' });
    }
};

const confirmAdminMatch = async (req, res) => {
    try {
        const { adminNotes = '' } = req.body || {};
        const io = req.app.get('io');

        const match = await Match.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                    confirmedBy: req.user._id,
                    rejectedAt: null,
                    rejectedBy: null,
                    adminNotes,
                },
            },
            { new: true }
        )
            .populate({
                path: 'lostItem',
                select: 'title reportedBy status',
                populate: { path: 'reportedBy', select: 'name email' },
            })
            .populate({
                path: 'foundItem',
                select: 'title reportedBy status',
                populate: { path: 'reportedBy', select: 'name email' },
            })
            .lean();

        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        await Item.updateMany(
            { _id: { $in: [match.lostItem?._id, match.foundItem?._id].filter(Boolean) } },
            { $set: { status: 'matched' } }
        );

        if (io) {
            io.to('admin').emit('matchConfirmed', {
                matchId: match._id,
                status: match.status,
                timestamp: new Date().toISOString(),
            });

            const lostOwnerId = match.lostItem?.reportedBy?._id;
            const foundOwnerId = match.foundItem?.reportedBy?._id;

            [lostOwnerId, foundOwnerId].filter(Boolean).forEach((userId) => {
                io.to(`user:${String(userId)}`).emit('matchConfirmed', {
                    matchId: match._id,
                    message: 'A potential match has been confirmed by admin.',
                });
                io.to(`user_${String(userId)}`).emit('matchConfirmed', {
                    matchId: match._id,
                    message: 'A potential match has been confirmed by admin.',
                });
            });
        }

        return res.status(200).json({ success: true, match });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to confirm match.' });
    }
};

const rejectAdminMatch = async (req, res) => {
    try {
        const { adminNotes = '' } = req.body || {};

        const match = await Match.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'rejected',
                    rejectedAt: new Date(),
                    rejectedBy: req.user._id,
                    confirmedAt: null,
                    confirmedBy: null,
                    adminNotes,
                },
            },
            { new: true }
        ).lean();

        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        return res.status(200).json({ success: true, match });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to reject match.' });
    }
};

const getAdminUsers = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(100, parsePositiveInt(req.query.limit, 10));
        const filter = {};

        if (req.query.search) {
            const searchRegex = new RegExp(escapeRegex(req.query.search), 'i');
            filter.$or = [{ name: searchRegex }, { email: searchRegex }, { studentId: searchRegex }];
        }

        if (req.query.role && req.query.role !== 'all') {
            filter.role = normalizeRole(req.query.role);
        }

        if (req.query.status && req.query.status !== 'all' && ['active', 'suspended'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        const userIds = users.map((user) => user._id);
        const reportedCounts = userIds.length
            ? await Item.aggregate([
                { $match: { reportedBy: { $in: userIds } } },
                { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
            ])
            : [];
        const countMap = reportedCounts.reduce((acc, entry) => {
            acc[String(entry._id)] = entry.count;
            return acc;
        }, {});

        const data = users.map((user) => ({
            ...user,
            role: normalizeRole(user.role),
            itemsReported: countMap[String(user._id)] || 0,
        }));

        return res.status(200).json({
            success: true,
            users: data,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch users.' });
    }
};

const getAdminUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const [recentItems, allItems, totalItems, matchedItems] = await Promise.all([
            Item.find({ reportedBy: user._id }).sort({ createdAt: -1 }).limit(5).lean(),
            Item.find({ reportedBy: user._id }).select('_id').lean(),
            Item.countDocuments({ reportedBy: user._id }),
            Item.countDocuments({ reportedBy: user._id, status: 'matched' }),
        ]);

        const itemIds = allItems.map((item) => item._id);
        const matchesFound = itemIds.length
            ? await Match.countDocuments({
                $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }],
            })
            : 0;

        return res.status(200).json({
            success: true,
            user: {
                ...user,
                role: normalizeRole(user.role),
            },
            summary: {
                itemsReported: totalItems,
                matchesFound,
                itemsClaimed: matchedItems,
            },
            recentItems,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch user details.' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const normalizedNewRole = normalizeRole(req.body?.role);
        if (![USER_ROLES.USER, USER_ROLES.ADMIN].includes(normalizedNewRole)) {
            return res.status(400).json({ message: 'Invalid role value.' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const previousRole = normalizeRole(user.role);
        user.role = normalizedNewRole;
        await user.save();

        if (previousRole !== USER_ROLES.ADMIN && normalizedNewRole === USER_ROLES.ADMIN) {
            await AdminLog.create({
                action: 'ROLE_ESCALATED_TO_ADMIN',
                performedBy: req.user._id,
                targetUser: user._id,
                metadata: {
                    previousRole,
                    nextRole: normalizedNewRole,
                },
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                role: normalizeRole(user.role),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update user role.' });
    }
};

const toggleSuspendUser = async (req, res) => {
    try {
        const reason = req.body?.reason || '';
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.status === 'suspended') {
            user.status = 'active';
            user.suspendedAt = null;
            user.suspendReason = '';
        } else {
            user.status = 'suspended';
            user.suspendedAt = new Date();
            user.suspendReason = reason;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                role: normalizeRole(user.role),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update account status.' });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const confirmationToken = req.body?.confirmationToken;
        if (confirmationToken !== 'DELETE') {
            return res.status(400).json({ message: 'Confirmation token is required and must be DELETE.' });
        }

        if (String(req.user._id) === String(req.params.id)) {
            return res.status(400).json({ message: 'You cannot delete your own admin account from this panel.' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await User.deleteOne({ _id: req.params.id });

        return res.status(200).json({ success: true, deletedUserId: req.params.id });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to delete user.' });
    }
};

const getAdminLogs = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePositiveInt(req.query.limit, 20);
        
        const [logs, total] = await Promise.all([
            AdminLog.find({})
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('performedBy', 'name email role')
                .populate('targetUser', 'name email role')
                .lean(),
            AdminLog.countDocuments({}),
        ]);

        return res.status(200).json({ success: true, logs, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch audit logs.' });
    }
};

const getAdminReports = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePositiveInt(req.query.limit, 20);
        const filter = {};
        if (req.query.search) filter.title = new RegExp(escapeRegex(req.query.search), 'i');
        if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
        if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

        const [reports, total] = await Promise.all([
            Item.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('reportedBy', 'name email role')
                .lean(),
            Item.countDocuments(filter),
        ]);

        return res.status(200).json({ success: true, reports, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch reports.' });
    }
};

const deleteAdminReport = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Report not found.' });

        await Item.deleteOne({ _id: item._id });
        await Match.deleteMany({ $or: [{ lostItem: item._id }, { foundItem: item._id }] });
        
        await AdminLog.create({
            action: 'ITEM_DELETED',
            performedBy: req.user._id,
            metadata: { itemId: req.params.id, title: item.title, type: item.type },
        });

        return res.status(200).json({ success: true, id: req.params.id });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete report.' });
    }
};

const sendAnnouncement = async (req, res) => {
    try {
        const { message, title = 'Admin Announcement', type = 'info' } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required.' });

        const io = req.app.get('io');
        if (io) {
            io.emit('broadcast', {
                title,
                message,
                type,
                timestamp: new Date().toISOString()
            });
        }
        
        await AdminLog.create({
            action: 'ANNOUNCEMENT_SENT',
            performedBy: req.user._id,
            metadata: { title, type },
        });

        return res.status(200).json({ success: true, message: 'Broadcast sent.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to broadcast announcement.' });
    }
};

const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getGlobalSettings();
        return res.status(200).json({ success: true, settings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch settings.' });
    }
};

const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings(req.body);
        else Object.assign(settings, req.body);
        
        await settings.save();
        
        await AdminLog.create({
            action: 'SETTINGS_UPDATED',
            performedBy: req.user._id,
            metadata: { keys: Object.keys(req.body) },
        });

        return res.status(200).json({ success: true, settings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update settings.' });
    }
};

module.exports = {
    getAdminStats,
    getAdminActivity,
    getAdminMatches,
    getAdminMatchById,
    confirmAdminMatch,
    rejectAdminMatch,
    getAdminUsers,
    getAdminUserById,
    updateUserRole,
    toggleSuspendUser,
    deleteUserAccount,
    getAdminLogs,
    getAdminReports,
    deleteAdminReport,
    sendAnnouncement,
    getSettings,
    updateSettings,
};
