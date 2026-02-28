const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lost', require('./routes/lost'));
app.use('/api/found', require('./routes/found'));
app.use('/api/search', require('./routes/search'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/communication', require('./routes/communication'));

// Socket.io integration
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room for a specific user to receive targeted notifications
    socket.on('join_user_room', (userId) => {
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
