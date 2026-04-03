import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';

export const useSocket = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user?._id) {
            socket.disconnect();
            return undefined;
        }

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('join', user._id);
        socket.emit('joinFeed');

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.disconnect();
        };
    }, [user?._id]);

    return socket;
};
