const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const Claim = require('../models/Claim');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- CHAT ENDPOINTS ---

// @desc    Get chat for a claim
// @route   GET /api/chat/:claimId
// @access  Private
const getChat = async (req, res) => {
    try {
        const { claimId } = req.params;

        // Verify user is part of the claim or item owner
        const claim = await Claim.findById(claimId).populate('itemId');
        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        // Simple access check (improve later if needed)
        let hasAccess = false;
        if (claim.claimant.toString() === req.user.id || req.user.role === 'admin') {
            hasAccess = true;
        } else if (claim.itemId && claim.itemId.postedBy && claim.itemId.postedBy.toString() === req.user.id) {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(401).json({ message: 'Not authorized to view this chat' });
        }

        let chat = await Chat.findOne({ claimId }).populate('messages.sender', 'name');

        // Auto-create chat if it doesn't exist and claim is approved
        if (!chat && claim.status === 'approved') {
            chat = await Chat.create({
                claimId,
                participants: [claim.claimant, claim.itemId.postedBy]
            });
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a message to a chat
// @route   POST /api/chat/:claimId/message
// @access  Private
const addMessage = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: 'Message text is required' });

        const chat = await Chat.findOne({ claimId });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // Validate participant
        if (!chat.participants.includes(req.user.id) && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not a participant in this chat' });
        }

        const newMessage = {
            sender: req.user.id,
            text
        };

        chat.messages.push(newMessage);
        await chat.save();

        // Populate sender name before returning
        const populatedChat = await Chat.findById(chat._id).populate('messages.sender', 'name');
        const addedMessage = populatedChat.messages[populatedChat.messages.length - 1];

        res.status(201).json(addedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    getChat,
    addMessage
};
