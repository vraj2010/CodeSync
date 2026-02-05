import React from 'react';
import { useVoiceRoom } from '../context/VoiceRoomContext';
import toast from 'react-hot-toast';

const VoiceControls = () => {
    const {
        isVoiceEnabled,
        isMuted,
        voiceParticipants,
        connectionStatus,
        joinVoice,
        leaveVoice,
        toggleMute,
    } = useVoiceRoom();

    const handleJoinVoice = async () => {
        try {
            await joinVoice();
            toast.success('Joined voice chat');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleLeaveVoice = () => {
        leaveVoice();
        toast.success('Left voice chat');
    };

    const handleToggleMute = () => {
        toggleMute();
        toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted', {
            icon: isMuted ? '🔊' : '🔇',
            duration: 1500,
        });
    };

    return (
        <div className="voiceControls">
            <div className="voiceHeader">
                <svg
                    className="voiceIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span className="voiceTitle">Voice Chat</span>
                {isVoiceEnabled && (
                    <span className={`voiceStatus ${connectionStatus}`}>
                        {connectionStatus === 'connected' ? '● Live' : '○ Connecting...'}
                    </span>
                )}
            </div>

            {isVoiceEnabled ? (
                <>
                    {/* Voice participants */}
                    {voiceParticipants.length > 0 && (
                        <div className="voiceParticipants">
                            <span className="participantCount">
                                {voiceParticipants.length + 1} in call
                            </span>
                            <div className="participantList">
                                <span className="participantBadge you">You</span>
                                {voiceParticipants.map((p) => (
                                    <span key={p.socketId} className="participantBadge">
                                        {p.username}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mute and Leave buttons */}
                    <div className="voiceButtonGroup">
                        <button
                            className={`btn voiceBtn muteBtn ${isMuted ? 'muted' : ''}`}
                            onClick={handleToggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                    <span>Unmute</span>
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                    <span>Mute</span>
                                </>
                            )}
                        </button>

                        <button
                            className="btn voiceBtn leaveVoiceBtn"
                            onClick={handleLeaveVoice}
                            title="Leave voice chat"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                            <span>Leave</span>
                        </button>
                    </div>
                </>
            ) : (
                <button
                    className="btn voiceBtn joinVoiceBtn"
                    onClick={handleJoinVoice}
                    disabled={connectionStatus === 'connecting'}
                >
                    {connectionStatus === 'connecting' ? (
                        <>
                            <span className="spinner"></span>
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>Join Voice</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default VoiceControls;
