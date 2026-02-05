import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import ACTIONS from '../Actions';

// WebRTC configuration with STUN servers for NAT traversal
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

const VoiceRoomContext = createContext(null);

export const useVoiceRoom = () => {
    const context = useContext(VoiceRoomContext);
    if (!context) {
        throw new Error('useVoiceRoom must be used within a VoiceRoomProvider');
    }
    return context;
};

export const VoiceRoomProvider = ({ children, socketRef, roomId, username }) => {
    // State
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceParticipants, setVoiceParticipants] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'

    // Refs
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }
    const remoteAudioRefs = useRef({}); // { socketId: HTMLAudioElement }
    const audioContainerRef = useRef(null);

    // Cleanup function for a single peer connection
    const cleanupPeerConnection = useCallback((socketId) => {
        if (peerConnectionsRef.current[socketId]) {
            peerConnectionsRef.current[socketId].close();
            delete peerConnectionsRef.current[socketId];
        }
        if (remoteAudioRefs.current[socketId]) {
            remoteAudioRefs.current[socketId].srcObject = null;
            remoteAudioRefs.current[socketId].remove();
            delete remoteAudioRefs.current[socketId];
        }
    }, []);

    // Create RTCPeerConnection for a specific peer
    const createPeerConnection = useCallback((targetSocketId, targetUsername) => {
        // Clean up existing connection if any
        cleanupPeerConnection(targetSocketId);

        const peerConnection = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionsRef.current[targetSocketId] = peerConnection;

        // Add local stream tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming remote stream
        peerConnection.ontrack = (event) => {
            console.log('🎧 Received remote track from:', targetUsername);

            // Create or get audio element for this peer
            if (!remoteAudioRefs.current[targetSocketId]) {
                const audioElement = document.createElement('audio');
                audioElement.id = `remote-audio-${targetSocketId}`;
                audioElement.autoplay = true;
                audioElement.playsInline = true;

                // Append to audio container if it exists
                if (audioContainerRef.current) {
                    audioContainerRef.current.appendChild(audioElement);
                } else {
                    document.body.appendChild(audioElement);
                }
                remoteAudioRefs.current[targetSocketId] = audioElement;
            }

            remoteAudioRefs.current[targetSocketId].srcObject = event.streams[0];
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit(ACTIONS.VOICE_ICE_CANDIDATE, {
                    roomId,
                    targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`📡 Connection state with ${targetUsername}:`, peerConnection.connectionState);

            if (peerConnection.connectionState === 'failed' ||
                peerConnection.connectionState === 'disconnected') {
                // Handle disconnection
                setVoiceParticipants(prev =>
                    prev.filter(p => p.socketId !== targetSocketId)
                );
            }
        };

        return peerConnection;
    }, [roomId, socketRef, cleanupPeerConnection]);

    // Create and send offer to a peer
    const createOffer = useCallback(async (targetSocketId, targetUsername) => {
        try {
            const peerConnection = createPeerConnection(targetSocketId, targetUsername);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.VOICE_OFFER, {
                    roomId,
                    targetSocketId,
                    offer,
                    username,
                });
            }
        } catch (error) {
            console.error('Failed to create offer:', error);
        }
    }, [createPeerConnection, roomId, socketRef, username]);

    // Handle incoming offer and create answer
    const handleOffer = useCallback(async (senderSocketId, senderUsername, offer) => {
        try {
            const peerConnection = createPeerConnection(senderSocketId, senderUsername);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.VOICE_ANSWER, {
                    roomId,
                    targetSocketId: senderSocketId,
                    answer,
                    username,
                });
            }

            // Add to participants if not already there
            setVoiceParticipants(prev => {
                if (!prev.find(p => p.socketId === senderSocketId)) {
                    return [...prev, { socketId: senderSocketId, username: senderUsername }];
                }
                return prev;
            });
        } catch (error) {
            console.error('Failed to handle offer:', error);
        }
    }, [createPeerConnection, roomId, socketRef, username]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (senderSocketId, senderUsername, answer) => {
        try {
            const peerConnection = peerConnectionsRef.current[senderSocketId];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

                // Add to participants if not already there
                setVoiceParticipants(prev => {
                    if (!prev.find(p => p.socketId === senderSocketId)) {
                        return [...prev, { socketId: senderSocketId, username: senderUsername }];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Failed to handle answer:', error);
        }
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (senderSocketId, candidate) => {
        try {
            const peerConnection = peerConnectionsRef.current[senderSocketId];
            if (peerConnection && candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }, []);

    // Join voice chat
    const joinVoice = useCallback(async () => {
        try {
            setConnectionStatus('connecting');

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });

            localStreamRef.current = stream;
            setIsVoiceEnabled(true);
            setConnectionStatus('connected');

            // Notify server that we joined voice
            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.VOICE_JOIN, {
                    roomId,
                    username,
                });
            }

            console.log('🎤 Voice chat joined successfully');
        } catch (error) {
            console.error('Failed to join voice chat:', error);
            setConnectionStatus('disconnected');

            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone permission denied. Please allow microphone access.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone.');
            } else {
                throw new Error('Failed to access microphone. Please try again.');
            }
        }
    }, [roomId, socketRef, username]);

    // Leave voice chat
    const leaveVoice = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close all peer connections
        Object.keys(peerConnectionsRef.current).forEach(socketId => {
            cleanupPeerConnection(socketId);
        });

        // Notify server
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.VOICE_LEAVE, {
                roomId,
                username,
            });
        }

        setIsVoiceEnabled(false);
        setIsMuted(false);
        setVoiceParticipants([]);
        setConnectionStatus('disconnected');

        console.log('🔇 Left voice chat');
    }, [roomId, socketRef, username, cleanupPeerConnection]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                console.log(audioTrack.enabled ? '🔊 Unmuted' : '🔇 Muted');
            }
        }
    }, []);

    // Socket event listeners
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // When another user joins voice chat
        const handleUserJoined = ({ socketId: peerSocketId, username: peerUsername }) => {
            console.log(`🎤 ${peerUsername} joined voice chat`);

            // Only create offer if we're already in voice chat
            if (isVoiceEnabled && localStreamRef.current) {
                createOffer(peerSocketId, peerUsername);
            }
        };

        // When another user leaves voice chat
        const handleUserLeft = ({ socketId: peerSocketId, username: peerUsername }) => {
            console.log(`🔇 ${peerUsername} left voice chat`);
            cleanupPeerConnection(peerSocketId);
            setVoiceParticipants(prev =>
                prev.filter(p => p.socketId !== peerSocketId)
            );
        };

        // Handle incoming offer
        const handleVoiceOffer = ({ senderSocketId, senderUsername, offer }) => {
            if (isVoiceEnabled) {
                handleOffer(senderSocketId, senderUsername, offer);
            }
        };

        // Handle incoming answer
        const handleVoiceAnswer = ({ senderSocketId, senderUsername, answer }) => {
            handleAnswer(senderSocketId, senderUsername, answer);
        };

        // Handle incoming ICE candidate
        const handleVoiceIceCandidate = ({ senderSocketId, candidate }) => {
            handleIceCandidate(senderSocketId, candidate);
        };

        socket.on(ACTIONS.VOICE_USER_JOINED, handleUserJoined);
        socket.on(ACTIONS.VOICE_USER_LEFT, handleUserLeft);
        socket.on(ACTIONS.VOICE_OFFER, handleVoiceOffer);
        socket.on(ACTIONS.VOICE_ANSWER, handleVoiceAnswer);
        socket.on(ACTIONS.VOICE_ICE_CANDIDATE, handleVoiceIceCandidate);

        return () => {
            socket.off(ACTIONS.VOICE_USER_JOINED, handleUserJoined);
            socket.off(ACTIONS.VOICE_USER_LEFT, handleUserLeft);
            socket.off(ACTIONS.VOICE_OFFER, handleVoiceOffer);
            socket.off(ACTIONS.VOICE_ANSWER, handleVoiceAnswer);
            socket.off(ACTIONS.VOICE_ICE_CANDIDATE, handleVoiceIceCandidate);
        };
    }, [socketRef, isVoiceEnabled, createOffer, handleOffer, handleAnswer, handleIceCandidate, cleanupPeerConnection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isVoiceEnabled) {
                leaveVoice();
            }
        };
    }, []);

    const value = {
        // State
        isVoiceEnabled,
        isMuted,
        voiceParticipants,
        connectionStatus,
        // Actions
        joinVoice,
        leaveVoice,
        toggleMute,
        // Refs
        audioContainerRef,
    };

    return (
        <VoiceRoomContext.Provider value={value}>
            {children}
            {/* Hidden container for remote audio elements */}
            <div
                ref={audioContainerRef}
                style={{ display: 'none' }}
                id="voice-audio-container"
            />
        </VoiceRoomContext.Provider>
    );
};

export default VoiceRoomContext;
