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

io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
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
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Language change sync
    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    socket.on(ACTIONS.SYNC_LANGUAGE, ({ socketId, language }) => {
        io.to(socketId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    // Code output sync
    socket.on(ACTIONS.CODE_OUTPUT, ({ roomId, output, isError }) => {
        socket.in(roomId).emit(ACTIONS.CODE_OUTPUT, { output, isError });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
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
