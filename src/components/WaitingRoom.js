import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import ACTIONS from '../Actions';

const WaitingRoom = ({ socket, roomId, onApproved, onDenied }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [status, setStatus] = useState('waiting'); // waiting | approved | denied
    const [waitTime, setWaitTime] = useState(0);

    useEffect(() => {
        if (!socket) return;

        // Listen for approval
        const handleApproved = ({ roomId: approvedRoomId }) => {
            if (approvedRoomId === roomId) {
                setStatus('approved');
                toast.success('🎉 Your request has been approved!');
                if (onApproved) onApproved();
            }
        };

        // Listen for denial
        const handleDenied = ({ reason }) => {
            setStatus('denied');
            toast.error(reason || 'Your request was denied by the admin.');
            if (onDenied) onDenied();
            // Navigate back after a short delay
            setTimeout(() => navigate('/dashboard'), 2000);
        };

        socket.on(ACTIONS.JOIN_APPROVED, handleApproved);
        socket.on(ACTIONS.JOIN_DENIED, handleDenied);

        // Track wait time
        const timer = setInterval(() => {
            setWaitTime(prev => prev + 1);
        }, 1000);

        return () => {
            socket.off(ACTIONS.JOIN_APPROVED, handleApproved);
            socket.off(ACTIONS.JOIN_DENIED, handleDenied);
            clearInterval(timer);
        };
    }, [socket, roomId, onApproved, onDenied, navigate]);

    const formatWaitTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCancel = () => {
        toast('Request cancelled');
        navigate('/dashboard');
    };

    return (
        <div className="waitingRoomWrapper">
            <div className="waitingRoomCard">
                {/* Header with logo */}
                <div className="waitingRoomHeader">
                    <img src="/code-sync.png" alt="CodeSync" className="waitingRoomLogo" />
                    <h1 className="logoText">Code<span>Sync</span></h1>
                </div>

                {/* Status indicator */}
                <div className="waitingRoomStatus">
                    {status === 'waiting' && (
                        <>
                            <div className="waitingAnimation">
                                <div className="waitingPulse"></div>
                                <div className="waitingIcon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h2>Waiting for Admin Approval</h2>
                            <p className="waitingDescription">
                                This room is <span className="privateTag">Private</span>.
                                Your request has been sent to the admin.
                            </p>
                        </>
                    )}

                    {status === 'approved' && (
                        <>
                            <div className="statusIcon approved">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2>Request Approved!</h2>
                            <p>Joining the workspace...</p>
                        </>
                    )}

                    {status === 'denied' && (
                        <>
                            <div className="statusIcon denied">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </div>
                            <h2>Request Denied</h2>
                            <p>Redirecting to dashboard...</p>
                        </>
                    )}
                </div>

                {/* User info */}
                {user && status === 'waiting' && (
                    <div className="waitingUserInfo">
                        <img
                            src={user.imageUrl}
                            alt={user.fullName || user.username}
                            className="waitingUserAvatar"
                        />
                        <div className="waitingUserDetails">
                            <span className="waitingUserName">{user.fullName || user.username}</span>
                            <span className="waitingUserEmail">{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </div>
                )}

                {/* Room info */}
                <div className="waitingRoomInfo">
                    <div className="infoItem">
                        <span className="infoLabel">Room ID</span>
                        <span className="infoValue">{roomId?.slice(0, 8)}...{roomId?.slice(-4)}</span>
                    </div>
                    <div className="infoItem">
                        <span className="infoLabel">Wait Time</span>
                        <span className="infoValue timeValue">{formatWaitTime(waitTime)}</span>
                    </div>
                </div>

                {/* Actions */}
                {status === 'waiting' && (
                    <div className="waitingRoomActions">
                        <button className="btn cancelWaitBtn" onClick={handleCancel}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Cancel Request
                        </button>
                    </div>
                )}

                {/* Tips */}
                {status === 'waiting' && (
                    <div className="waitingTips">
                        <p>💡 <strong>Tip:</strong> The admin will see your name and profile picture.</p>
                    </div>
                )}
            </div>

            {/* Background decorations */}
            <div className="waitingBgDecor">
                <div className="decorCircle circle1"></div>
                <div className="decorCircle circle2"></div>
                <div className="decorCircle circle3"></div>
            </div>
        </div>
    );
};

export default WaitingRoom;
