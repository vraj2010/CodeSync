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
    // Voice chat - WebRTC signaling
    VOICE_JOIN: 'voice-join',
    VOICE_LEAVE: 'voice-leave',
    VOICE_OFFER: 'voice-offer',
    VOICE_ANSWER: 'voice-answer',
    VOICE_ICE_CANDIDATE: 'voice-ice-candidate',
    VOICE_USER_JOINED: 'voice-user-joined',
    VOICE_USER_LEFT: 'voice-user-left',
};

module.exports = ACTIONS;
