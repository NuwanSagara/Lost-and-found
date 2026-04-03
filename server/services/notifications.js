let socketServer = null;

const setSocketServer = (io) => {
    socketServer = io;
};

const sendMatchNotification = async (userId, matches) => {
    if (!userId) {
        return;
    }

    const payload = {
        userId,
        message: `A new high-confidence match was found for one of your items (${matches.length} potential match${matches.length === 1 ? '' : 'es'}).`,
        link: '/dashboard',
        matches,
    };

    if (socketServer) {
        socketServer.to(`user_${userId}`).emit('receive_notification', payload);
        socketServer.to(`user:${userId}`).emit('receive_notification', payload);
    } else {
        console.log('Match notification queued:', payload);
    }
};

module.exports = {
    setSocketServer,
    sendMatchNotification,
};
