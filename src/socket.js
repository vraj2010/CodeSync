import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        withCredentials: true,
    };

    // In production (Render), frontend and backend are served from the same origin
    // In development, use the environment variable
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    return io(backendUrl, options);
};
