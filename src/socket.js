import { io } from 'socket.io-client';

export const initSocket = async () => {
    // In production (Render), frontend and backend are served from the same origin
    // In development, use the environment variable
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    console.log('🔌 Connecting to socket server:', backendUrl);

    const options = {
        // Force a new connection each time
        forceNew: true,
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        // Timeout settings (increased for cloud hosting)
        timeout: 60000,
        // Use only polling for Render compatibility
        transports: ['polling'],
        // Path must match server
        path: '/socket.io/',
    };

    const socket = io(backendUrl, options);

    // Debug connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        console.log('📡 Transport:', socket.io.engine.transport.name);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    return socket;
};
