import { io } from 'socket.io-client';

export const initSocket = async () => {
    // IMPORTANT: In production, ALWAYS use the current URL origin
    // REACT_APP_BACKEND_URL is ONLY for local development
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    const backendUrl = isLocalhost
        ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000')
        : window.location.origin;

    console.log('🔌 Connecting to socket server:', backendUrl);
    console.log('🌍 Environment:', isLocalhost ? 'Development' : 'Production');

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
