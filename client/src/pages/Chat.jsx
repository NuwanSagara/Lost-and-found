import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const Chat = () => {
    const { id } = useParams(); // claimId
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [claim, setClaim] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // 1. Fetch claim details and past messages
        const fetchChatData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/communication/${id}`);
                setClaim(res.data.claim);
                setMessages(res.data.messages);
            } catch (error) {
                console.error('Failed to fetch chat data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChatData();

        // 2. Join the socket room for this chat
        if (socket) {
            socket.emit('join_chat', id);

            // 3. Listen for incoming messages
            socket.on('receive_message', (messageData) => {
                // messageData { _id, claimId, sender, text, senderName, timestamp }
                if (messageData.claimId === id) {
                    setMessages((prev) => [...prev, messageData]);
                }
            });
        }

        // Cleanup listener on unmount
        return () => {
            if (socket) {
                socket.off('receive_message');
            }
        };
    }, [id, socket]);

    // Handle auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !claim) return;

        const messagePayload = {
            claimId: claim._id,
            text: newMessage,
        };

        try {
            // Send to DB via API
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/communication/${id}/message`, messagePayload);

            const newMsg = {
                _id: res.data._id || Date.now().toString(),
                claimId: claim._id,
                sender: user._id,
                senderName: user.name, // Local assumption for quick display
                text: newMessage,
                timestamp: new Date().toISOString()
            };

            // Emit over socket to other user
            socket.emit('send_message', newMsg);

            // Update local state (optimistic)
            setMessages((prev) => [...prev, newMsg]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Chat Not Found</h2>
                <p className="mt-2 text-gray-500">This claim conversation does not exist or you don't have access.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 text-indigo-600 font-medium hover:text-indigo-800">
                    &larr; Back to Dashboard
                </button>
            </div>
        );
    }

    // Determine who we are talking to
    const isClaimant = user._id === claim.claimant;
    const otherPartyName = isClaimant ? 'Item Poster' : 'Claimant'; // Simplified

    return (
        <div className="max-w-4xl mx-auto h-[85vh] flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            Chat regarding: {claim.itemId?.title || 'Unknown Item'}
                            {claim.status === 'approved' && <ShieldCheck className="w-4 h-4 ml-2 text-green-500" title="Claim Approved" />}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Talking to {otherPartyName}
                        </p>
                    </div>
                </div>
                <div className="text-sm font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full capitalize">
                    Status: {claim.status}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>No messages yet.</p>
                        <p className="text-sm mt-1">Send a message to coordinate the return.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender === user._id || msg.sender?._id === user._id;
                        const showDateDivider = index === 0 ||
                            format(new Date(messages[index - 1].timestamp || messages[index - 1].createdAt), 'MMM d') !==
                            format(new Date(msg.timestamp || msg.createdAt), 'MMM d');

                        return (
                            <React.Fragment key={msg._id || index}>
                                {showDateDivider && (
                                    <div className="flex justify-center my-6">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                                            {format(new Date(msg.timestamp || msg.createdAt), 'MMMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none'
                                        }`}>
                                        {!isMe && msg.senderName && (
                                            <p className="text-xs font-semibold text-gray-500 mb-1">{msg.senderName}</p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        <p className={`text-xs mt-2 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {format(new Date(msg.timestamp || msg.createdAt), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Function Area */}
            <div className="bg-white border-t border-gray-200 p-4 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-full sm:text-sm border-gray-300 px-4 py-3 border bg-gray-50 transition-colors focus:bg-white"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center justify-center p-3 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        <Send className="h-5 w-5 ml-1" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
