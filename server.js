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

// Track voice chat participants per room
const voiceParticipants = {};

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
            version: 0,
            admin: null, // Socket ID of admin
            status: 'public', // public | private
            readOnly: false,
            allowedUsers: new Set(),
        };
    }
    return roomState[roomId];
}

io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        const state = getRoomState(roomId);

        // Initialize admin if room is new (or admin left and state was kept)
        if (!state.admin) {
            state.admin = socket.id;
            state.allowedUsers.add(socket.id);
        }

        // Check privacy access
        // If room is private and user is NOT allowed
        if (state.status === 'private' && !state.allowedUsers.has(socket.id)) {
            // Check if admin is online
            if (state.admin && userSocketMap[state.admin]) {
                io.to(state.admin).emit(ACTIONS.REQUEST_JOIN, {
                    username,
                    socketId: socket.id,
                });
                socket.emit(ACTIONS.JOIN_REQUEST, { status: 'waiting', username });
            } else {
                socket.emit(ACTIONS.JOIN_DENIED, { reason: 'Admin unavailable' });
            }
            return;
        }

        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        console.log(`👤 ${username} joined room ${roomId}. Total clients: ${clients.length}`);

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

        // Emit Room Info (including admin status) to the joiner
        socket.emit(ACTIONS.ADMIN_UPDATE, {
            isAdmin: state.admin === socket.id,
            status: state.status,
            readOnly: state.readOnly
        });

        // Sync current room state to the new user
        if (clients.length > 1) {
            io.to(socket.id).emit(ACTIONS.CODE_CHANGE, { code: state.code });
            io.to(socket.id).emit(ACTIONS.LANGUAGE_CHANGE, { language: state.language });
            io.to(socket.id).emit(ACTIONS.INPUT_CHANGE, { input: state.input });
        }
    });

    // Admin: Approve Join
    socket.on(ACTIONS.JOIN_APPROVED, ({ socketId, roomId }) => {
        const state = getRoomState(roomId);
        if (state.admin === socket.id) {
            state.allowedUsers.add(socketId);
            io.to(socketId).emit(ACTIONS.JOIN_APPROVED, { roomId });
        }
    });

    // Admin: Deny Join
    socket.on(ACTIONS.JOIN_DENIED, ({ socketId, roomId }) => {
        const state = getRoomState(roomId);
        if (state.admin === socket.id) {
            io.to(socketId).emit(ACTIONS.JOIN_DENIED, { reason: 'Request denied by admin' });
        }
    });

    // Admin: Update Settings (Status/ReadOnly)
    socket.on(ACTIONS.ADMIN_UPDATE, ({ roomId, status, readOnly }) => {
        const state = getRoomState(roomId);
        if (state.admin === socket.id) {
            if (status) state.status = status;
            if (typeof readOnly === 'boolean') state.readOnly = readOnly;

            // Broadcast new settings to everyone
            io.in(roomId).emit(ACTIONS.ADMIN_UPDATE, {
                status: state.status,
                readOnly: state.readOnly,
            });
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

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // Transfer Admin if needed
            const state = roomState[roomId];
            if (state && state.admin === socket.id) {
                const remainingClients = getAllConnectedClients(roomId).filter(c => c.socketId !== socket.id);
                if (remainingClients.length > 0) {
                    const newAdmin = remainingClients[0];
                    state.admin = newAdmin.socketId;
                    state.allowedUsers.add(newAdmin.socketId);

                    // Notify everyone about new admin status
                    remainingClients.forEach(client => {
                        io.to(client.socketId).emit(ACTIONS.ADMIN_UPDATE, {
                            isAdmin: client.socketId === state.admin,
                            status: state.status,
                            readOnly: state.readOnly
                        });
                    });
                }
            }

            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            // Notify voice participants if user was in voice chat
            if (voiceParticipants[roomId]?.has(socket.id)) {
                socket.in(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id],
                });
                voiceParticipants[roomId].delete(socket.id);
            }

            // Clean up empty rooms
            const clients = getAllConnectedClients(roomId);
            if (clients.length <= 1) {
                delete roomState[roomId];
                delete voiceParticipants[roomId];
            }
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });

    // ============ Voice Chat - WebRTC Signaling ============

    // User joins voice chat
    socket.on(ACTIONS.VOICE_JOIN, ({ roomId, username }) => {
        console.log(`🎤 ${username} joined voice chat in room ${roomId}`);

        // Initialize voice participants set for room if not exists
        if (!voiceParticipants[roomId]) {
            voiceParticipants[roomId] = new Set();
        }

        // Notify existing voice participants about new user
        voiceParticipants[roomId].forEach((participantSocketId) => {
            io.to(participantSocketId).emit(ACTIONS.VOICE_USER_JOINED, {
                socketId: socket.id,
                username,
            });
        });

        // Add user to voice participants
        voiceParticipants[roomId].add(socket.id);
    });

    // User leaves voice chat
    socket.on(ACTIONS.VOICE_LEAVE, ({ roomId, username }) => {
        console.log(`🔇 ${username} left voice chat in room ${roomId}`);

        if (voiceParticipants[roomId]) {
            voiceParticipants[roomId].delete(socket.id);

            // Notify other voice participants
            socket.in(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
                socketId: socket.id,
                username,
            });
        }
    });

    // WebRTC offer
    socket.on(ACTIONS.VOICE_OFFER, ({ roomId, targetSocketId, offer, username }) => {
        io.to(targetSocketId).emit(ACTIONS.VOICE_OFFER, {
            senderSocketId: socket.id,
            senderUsername: username,
            offer,
        });
    });

    // WebRTC answer
    socket.on(ACTIONS.VOICE_ANSWER, ({ roomId, targetSocketId, answer, username }) => {
        io.to(targetSocketId).emit(ACTIONS.VOICE_ANSWER, {
            senderSocketId: socket.id,
            senderUsername: username,
            answer,
        });
    });

    // ICE candidate
    socket.on(ACTIONS.VOICE_ICE_CANDIDATE, ({ roomId, targetSocketId, candidate }) => {
        io.to(targetSocketId).emit(ACTIONS.VOICE_ICE_CANDIDATE, {
            senderSocketId: socket.id,
            candidate,
        });
    });
});

// Start server - bind to 0.0.0.0 for Render
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${isProduction ? 'Production' : 'Development'}`);
});
