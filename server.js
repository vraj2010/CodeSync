const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const codeRoutes = require('./routes/codeRoutes');

// Environment
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io configuration optimized for Render
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    // Use only polling on Render (more reliable than WebSocket through their proxy)
    transports: ['polling'],
    // Path must match what client expects
    path: '/socket.io/',
    // Increase timeouts for cloud hosting
    pingTimeout: 120000,
    pingInterval: 30000,
    // Upgrade timeout
    upgradeTimeout: 30000,
    // Allow requests without credentials
    cookie: false,
    // Compatibility
    allowEIO3: true,
    // Connection state recovery
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
    }
});

// Log all socket.io errors
io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.io connection error:', err.code, err.message);
});

// Middleware - Allow all origins for API requests
app.use(cors());
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'production' : 'development',
        connectedSockets: io.engine.clientsCount || 0
    });
});

// API Routes (must come before static file serving)
app.use('/api', codeRoutes);

// Static files and SPA fallback
app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Store room state for syncing new users
const roomState = {};

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

// Get or create room state
function getRoomState(roomId) {
    if (!roomState[roomId]) {
        roomState[roomId] = {
            code: '',
            language: 'javascript',
            input: '',
            version: 0
        };
    }
    return roomState[roomId];
}

// Track users in voice chat per room
const voiceUsersMap = {}; // { roomId: [{ socketId, username }] }

function getVoiceUsers(roomId) {
    if (!voiceUsersMap[roomId]) {
        voiceUsersMap[roomId] = [];
    }
    return voiceUsersMap[roomId];
}

function addVoiceUser(roomId, socketId, username) {
    const voiceUsers = getVoiceUsers(roomId);
    // Remove if already exists (reconnection case)
    const existingIndex = voiceUsers.findIndex(u => u.socketId === socketId);
    if (existingIndex !== -1) {
        voiceUsers.splice(existingIndex, 1);
    }
    voiceUsers.push({ socketId, username, isMuted: false });
    return voiceUsers;
}

function removeVoiceUser(roomId, socketId) {
    const voiceUsers = getVoiceUsers(roomId);
    const index = voiceUsers.findIndex(u => u.socketId === socketId);
    if (index !== -1) {
        voiceUsers.splice(index, 1);
    }
    return voiceUsers;
}

io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        console.log(`👤 ${username} joined room ${roomId}. Total clients: ${clients.length}`);

        // Get room state for syncing
        const state = getRoomState(roomId);

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

        // Sync current room state to the new user
        if (clients.length > 1) {
            // Send current code to the new user
            io.to(socket.id).emit(ACTIONS.CODE_CHANGE, { code: state.code });
            io.to(socket.id).emit(ACTIONS.LANGUAGE_CHANGE, { language: state.language });
            io.to(socket.id).emit(ACTIONS.INPUT_CHANGE, { input: state.input });
        }
    });

    // Delta-based code sync - more efficient for real-time editing
    socket.on(ACTIONS.CODE_DELTA, ({ roomId, delta }) => {
        const state = getRoomState(roomId);
        state.version++;

        // Broadcast delta to all other users in the room
        socket.in(roomId).emit(ACTIONS.CODE_DELTA, {
            delta,
            socketId: socket.id // Include sender ID so receiver can filter
        });
    });

    // Full code change (for backwards compatibility and initial sync)
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        const state = getRoomState(roomId);
        state.code = code;
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Language change sync
    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        const state = getRoomState(roomId);
        state.language = language;
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    socket.on(ACTIONS.SYNC_LANGUAGE, ({ socketId, language }) => {
        io.to(socketId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    // Code output sync
    socket.on(ACTIONS.CODE_OUTPUT, ({ roomId, output, isError }) => {
        socket.in(roomId).emit(ACTIONS.CODE_OUTPUT, { output, isError });
    });

    // Cursor position sync - broadcast to everyone except sender
    socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, position, username }) => {
        socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, {
            position,
            username,
            socketId: socket.id
        });
    });

    // Input change sync
    socket.on(ACTIONS.INPUT_CHANGE, ({ roomId, input }) => {
        const state = getRoomState(roomId);
        state.input = input;
        socket.in(roomId).emit(ACTIONS.INPUT_CHANGE, { input });
    });

    socket.on(ACTIONS.SYNC_INPUT, ({ socketId, input }) => {
        io.to(socketId).emit(ACTIONS.INPUT_CHANGE, { input });
    });

    // ==================== VOICE CHAT (WebRTC Signaling) ====================

    // User joins voice chat
    socket.on(ACTIONS.VOICE_JOIN, ({ roomId, username }) => {
        console.log(`🎤 ${username} joined voice chat in room ${roomId}`);

        const voiceUsers = addVoiceUser(roomId, socket.id, username);

        // Notify all users in the room about the new voice user
        io.in(roomId).emit(ACTIONS.VOICE_USER_JOINED, {
            socketId: socket.id,
            username,
            voiceUsers
        });
    });

    // WebRTC signaling - forward signal to target peer
    socket.on(ACTIONS.VOICE_SIGNAL, ({ roomId, targetSocketId, signal, fromSocketId }) => {
        io.to(targetSocketId).emit(ACTIONS.VOICE_SIGNAL, {
            signal,
            fromSocketId
        });
    });

    // User leaves voice chat
    socket.on(ACTIONS.VOICE_USER_LEFT, ({ roomId, username }) => {
        console.log(`🎤 ${username} left voice chat in room ${roomId}`);

        const voiceUsers = removeVoiceUser(roomId, socket.id);

        // Notify all users in the room
        io.in(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
            socketId: socket.id,
            username,
            voiceUsers
        });
    });

    // User mutes/unmutes
    socket.on(ACTIONS.VOICE_MUTE, ({ roomId, isMuted, username }) => {
        const voiceUsers = getVoiceUsers(roomId);
        const user = voiceUsers.find(u => u.socketId === socket.id);
        if (user) {
            user.isMuted = isMuted;
        }

        // Broadcast mute status to room
        socket.in(roomId).emit(ACTIONS.VOICE_MUTE, {
            socketId: socket.id,
            isMuted,
            username
        });
    });

    // ==================== DISCONNECTION ====================

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // Notify about disconnection
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            // Remove from voice chat if in one
            const voiceUsers = removeVoiceUser(roomId, socket.id);
            if (voiceUsers.length > 0 || voiceUsersMap[roomId]) {
                socket.in(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id],
                    voiceUsers
                });
            }

            // Clean up empty rooms
            const clients = getAllConnectedClients(roomId);
            if (clients.length <= 1) {
                delete roomState[roomId];
                delete voiceUsersMap[roomId];
            }
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

// Start server - bind to 0.0.0.0 for Render
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${isProduction ? 'Production' : 'Development'}`);
});
