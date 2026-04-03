import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let newSocket = null;
        const apiUrl = import.meta.env.VITE_API_URL;

        if (user && apiUrl) {
            // Connect to the Socket.io server
            newSocket = io(apiUrl.replace('/api', ''), {
                autoConnect: true,
            });

            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                // Join user's personal room for notifications
                newSocket.emit('join_user_room', user._id || user.id);
            });

            // We can also set up a global listener for notifications here if we want them to pop up anywhere
            newSocket.on('receive_notification', (data) => {
                console.log('New notification:', data);
                // Dispatch to a toast or global notification state here
            });
        }

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
