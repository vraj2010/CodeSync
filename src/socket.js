import { io } from 'socket.io-client';

export const initSocket = async () => {
    // In production (Render), frontend and backend are served from the same origin
    // In development, use the environment variable
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    console.log('🔌 Connecting to socket server:', backendUrl);

    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Start with polling (more reliable), then upgrade to websocket
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: true,
    };

    const socket = io(backendUrl, options);

    // Debug connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    return socket;
};

