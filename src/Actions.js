const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    CODE_DELTA: 'code-delta', // Delta-based sync for real-time collaboration
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
    LANGUAGE_CHANGE: 'language-change',
    SYNC_LANGUAGE: 'sync-language',
    CODE_OUTPUT: 'code-output',
    // Cursor position sync
    CURSOR_CHANGE: 'cursor-change',
    // Input sync
    INPUT_CHANGE: 'input-change',
    SYNC_INPUT: 'sync-input',

    // Voice Chat (WebRTC signaling)
    VOICE_JOIN: 'voice-join',           // User wants to join voice chat
    VOICE_SIGNAL: 'voice-signal',       // WebRTC signaling data
    VOICE_USER_JOINED: 'voice-user-joined', // New user joined voice
    VOICE_USER_LEFT: 'voice-user-left', // User left voice chat
    VOICE_MUTE: 'voice-mute',           // User muted/unmuted
};

module.exports = ACTIONS;
