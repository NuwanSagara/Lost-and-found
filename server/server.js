const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { setSocketServer } = require('./services/notifications');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    },
});

// Middleware
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('io', io);

// Database connection
if (process.env.MONGODB_URI) {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGODB_URI not configured. MongoDB-backed routes may be unavailable.');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lost', require('./routes/lost'));
app.use('/api/found', require('./routes/found'));
app.use('/api/search', require('./routes/search'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/items', require('./routes/items'));
app.use('/api/match', require('./routes/match'));
app.use('/api/matches', require('./routes/match'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io integration
setSocketServer(io);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join', (userId) => {
        socket.join(`user:${userId}`);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal rooms`);
    });

    socket.on('joinFeed', () => {
        socket.join('feed');
        console.log(`Socket ${socket.id} joined global feed`);
    });

    socket.on('joinAdmin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined admin room`);
    });

    // Join a room for a specific user to receive targeted notifications
    socket.on('join_user_room', (userId) => {
        socket.join(`user:${userId}`);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their notification room`);
    });

    // Join a specific chat room
    socket.on('join_chat', (claimId) => {
        socket.join(`chat_${claimId}`);
        console.log(`User joined chat room: chat_${claimId}`);
    });

    // Handle sending a message
    socket.on('send_message', (data) => {
        // data contains { claimId, sender, text, senderName }
        io.to(`chat_${data.claimId}`).emit('receive_message', data);
    });

    // Handle sending a notification
    socket.on('send_notification', (data) => {
        // data { userId, message, link }
        io.to(`user_${data.userId}`).emit('receive_notification', data);
        io.to(`user:${data.userId}`).emit('receive_notification', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('Lost & Found API is running...');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
