import React, { useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'simple-peer';
import ACTIONS from '../Actions';
import './VoiceChat.css';

/**
 * VoiceChat Component
 * Enables real-time voice communication using WebRTC
 * 
 * Props:
 * - socketRef: Reference to the socket.io connection
 * - roomId: Current room ID
 * - clients: Array of connected clients
 * - currentUsername: Current user's username
 */
const VoiceChat = ({ socketRef, roomId, clients, currentUsername }) => {
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceUsers, setVoiceUsers] = useState([]); // Users in voice chat
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'

    const localStreamRef = useRef(null);
    const peersRef = useRef({}); // { socketId: Peer }
    const audioElementsRef = useRef({}); // { socketId: HTMLAudioElement }

    // Initialize microphone stream
    const initializeAudio = useCallback(async () => {
        try {
            setConnectionStatus('connecting');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setConnectionStatus('disconnected');
            if (error.name === 'NotAllowedError') {
                alert('Microphone access denied. Please allow microphone access to use voice chat.');
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found. Please connect a microphone to use voice chat.');
            } else {
                alert('Failed to access microphone. Please check your audio settings.');
            }
            return null;
        }
    }, []);

    // Create a peer connection for a specific user
    const createPeer = useCallback((targetSocketId, initiator, stream) => {
        const peer = new Peer({
            initiator,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                ]
            }
        });

        peer.on('signal', (signal) => {
            socketRef.current.emit(ACTIONS.VOICE_SIGNAL, {
                roomId,
                targetSocketId,
                signal,
                fromSocketId: socketRef.current.id
            });
        });

        peer.on('stream', (remoteStream) => {
            // Create or get audio element for this peer
            if (!audioElementsRef.current[targetSocketId]) {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.autoplay = true;
                audioElementsRef.current[targetSocketId] = audio;
            } else {
                audioElementsRef.current[targetSocketId].srcObject = remoteStream;
            }
        });

        peer.on('connect', () => {
            console.log(`🎤 Voice connected with ${targetSocketId}`);
        });

        peer.on('error', (err) => {
            console.error(`Peer error with ${targetSocketId}:`, err);
        });

        peer.on('close', () => {
            console.log(`🎤 Voice disconnected from ${targetSocketId}`);
            cleanupPeer(targetSocketId);
        });

        return peer;
    }, [roomId, socketRef]);

    // Clean up a peer connection
    const cleanupPeer = useCallback((socketId) => {
        if (peersRef.current[socketId]) {
            peersRef.current[socketId].destroy();
            delete peersRef.current[socketId];
        }
        if (audioElementsRef.current[socketId]) {
            audioElementsRef.current[socketId].srcObject = null;
            delete audioElementsRef.current[socketId];
        }
    }, []);

    // Join voice chat
    const joinVoiceChat = useCallback(async () => {
        const stream = await initializeAudio();
        if (!stream) return;

        setIsVoiceEnabled(true);
        setConnectionStatus('connected');

        // Notify server that we're joining voice
        socketRef.current.emit(ACTIONS.VOICE_JOIN, {
            roomId,
            username: currentUsername
        });

        // Create peer connections with existing voice users
        voiceUsers.forEach(user => {
            if (user.socketId !== socketRef.current.id && !peersRef.current[user.socketId]) {
                const peer = createPeer(user.socketId, true, stream);
                peersRef.current[user.socketId] = peer;
            }
        });
    }, [initializeAudio, socketRef, roomId, currentUsername, voiceUsers, createPeer]);

    // Leave voice chat
    const leaveVoiceChat = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Clean up all peer connections
        Object.keys(peersRef.current).forEach(socketId => {
            cleanupPeer(socketId);
        });

        // Notify server
        socketRef.current.emit(ACTIONS.VOICE_USER_LEFT, {
            roomId,
            username: currentUsername
        });

        setIsVoiceEnabled(false);
        setIsMuted(false);
        setConnectionStatus('disconnected');
    }, [socketRef, roomId, currentUsername, cleanupPeer]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                // Notify others about mute status
                socketRef.current.emit(ACTIONS.VOICE_MUTE, {
                    roomId,
                    isMuted: !audioTrack.enabled,
                    username: currentUsername
                });
            }
        }
    }, [socketRef, roomId, currentUsername]);

    // Socket event listeners
    useEffect(() => {
        if (!socketRef.current) return;

        const socket = socketRef.current;

        // When a new user joins voice chat
        socket.on(ACTIONS.VOICE_USER_JOINED, ({ socketId, username, voiceUsers: updatedVoiceUsers }) => {
            console.log(`🎤 ${username} joined voice chat`);
            setVoiceUsers(updatedVoiceUsers);

            // If we're in voice chat, create a peer connection
            if (isVoiceEnabled && localStreamRef.current && socketId !== socket.id) {
                if (!peersRef.current[socketId]) {
                    const peer = createPeer(socketId, true, localStreamRef.current);
                    peersRef.current[socketId] = peer;
                }
            }
        });

        // When we receive a WebRTC signal
        socket.on(ACTIONS.VOICE_SIGNAL, ({ signal, fromSocketId }) => {
            if (peersRef.current[fromSocketId]) {
                // We already have a peer, just signal
                peersRef.current[fromSocketId].signal(signal);
            } else if (isVoiceEnabled && localStreamRef.current) {
                // Create a new peer (we're the receiver)
                const peer = createPeer(fromSocketId, false, localStreamRef.current);
                peersRef.current[fromSocketId] = peer;
                peer.signal(signal);
            }
        });

        // When a user leaves voice chat
        socket.on(ACTIONS.VOICE_USER_LEFT, ({ socketId, username, voiceUsers: updatedVoiceUsers }) => {
            console.log(`🎤 ${username} left voice chat`);
            setVoiceUsers(updatedVoiceUsers);
            cleanupPeer(socketId);
        });

        // When a user mutes/unmutes
        socket.on(ACTIONS.VOICE_MUTE, ({ socketId, isMuted, username }) => {
            setVoiceUsers(prev => prev.map(user =>
                user.socketId === socketId ? { ...user, isMuted } : user
            ));
        });

        return () => {
            socket.off(ACTIONS.VOICE_USER_JOINED);
            socket.off(ACTIONS.VOICE_SIGNAL);
            socket.off(ACTIONS.VOICE_USER_LEFT);
            socket.off(ACTIONS.VOICE_MUTE);
        };
    }, [socketRef, isVoiceEnabled, createPeer, cleanupPeer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.keys(peersRef.current).forEach(socketId => {
                if (peersRef.current[socketId]) {
                    peersRef.current[socketId].destroy();
                }
            });
        };
    }, []);

    // Get voice participants for display
    const voiceParticipants = voiceUsers.filter(u => u.socketId !== socketRef.current?.id);

    return (
        <div className="voice-chat-container">
            <div className="voice-chat-header">
                <div className="voice-header-left">
                    <span className="voice-icon">🎤</span>
                    <span className="voice-title">Voice Chat</span>
                    {isVoiceEnabled && (
                        <span className={`voice-status ${connectionStatus}`}>
                            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                        </span>
                    )}
                </div>
                <div className="voice-header-right">
                    {voiceUsers.length > 0 && (
                        <span className="voice-count">{voiceUsers.length} in call</span>
                    )}
                </div>
            </div>

            {isVoiceEnabled && voiceParticipants.length > 0 && (
                <div className="voice-participants">
                    {voiceParticipants.map(user => (
                        <div key={user.socketId} className="voice-participant">
                            <div className={`participant-avatar ${user.isMuted ? 'muted' : 'speaking'}`}>
                                {user.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="participant-name">{user.username}</span>
                            {user.isMuted && <span className="muted-icon">🔇</span>}
                        </div>
                    ))}
                </div>
            )}

            <div className="voice-controls">
                {!isVoiceEnabled ? (
                    <button
                        className="voice-btn join-voice"
                        onClick={joinVoiceChat}
                        title="Join Voice Chat"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                        <span>Join Voice</span>
                    </button>
                ) : (
                    <>
                        <button
                            className={`voice-btn mute-btn ${isMuted ? 'muted' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            )}
                        </button>
                        <button
                            className="voice-btn leave-voice"
                            onClick={leaveVoiceChat}
                            title="Leave Voice Chat"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                                <line x1="23" y1="1" x2="1" y2="23" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VoiceChat;
