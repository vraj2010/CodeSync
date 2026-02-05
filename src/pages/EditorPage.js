import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useUser, UserButton } from '@clerk/clerk-react';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import OutputPanel from '../components/OutputPanel';
import VoiceControls from '../components/VoiceControls';
import WaitingRoom from '../components/WaitingRoom';
import { VoiceRoomProvider } from '../context/VoiceRoomContext';
import { initSocket } from '../socket';
import { executeCode } from '../api/codeApi';
import { SUPPORTED_LANGUAGES, getPistonLanguage } from '../utils/languageMapping';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    // Get Clerk user info
    const { user, isLoaded: isUserLoaded } = useUser();

    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Touch swipe gesture for mobile sidebar
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const SWIPE_THRESHOLD = 50; // Minimum swipe distance
    const EDGE_ZONE = 30; // Pixels from left edge to trigger swipe

    useEffect(() => {
        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
        };

        const handleTouchEnd = (e) => {
            if (touchStartX.current === null) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX.current;
            const deltaY = touch.clientY - touchStartY.current;

            // Check if horizontal swipe is dominant (not scrolling)
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Swipe right from left edge to open sidebar
                if (deltaX > SWIPE_THRESHOLD && touchStartX.current < EDGE_ZONE && !isSidebarOpen) {
                    setIsSidebarOpen(true);
                }
                // Swipe left to close sidebar
                else if (deltaX < -SWIPE_THRESHOLD && isSidebarOpen) {
                    setIsSidebarOpen(false);
                }
            }

            touchStartX.current = null;
            touchStartY.current = null;
        };

        // Only add swipe listeners on small screens
        const mediaQuery = window.matchMedia('(max-width: 482px)');

        const addSwipeListeners = () => {
            if (mediaQuery.matches) {
                document.addEventListener('touchstart', handleTouchStart, { passive: true });
                document.addEventListener('touchend', handleTouchEnd, { passive: true });
            }
        };

        const removeSwipeListeners = () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        const handleMediaChange = (e) => {
            if (e.matches) {
                addSwipeListeners();
            } else {
                removeSwipeListeners();
            }
        };

        // Initial setup
        addSwipeListeners();
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => {
            removeSwipeListeners();
            mediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, [isSidebarOpen]);

    // Code execution state
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isError, setIsError] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const isRunningRef = useRef(false); // Prevent duplicate requests

    // Input state for stdin
    const [input, setInput] = useState('');

    // Admin & Access Control State
    const [isAdmin, setIsAdmin] = useState(false);
    const [roomStatus, setRoomStatus] = useState('public');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [joinRequestPending, setJoinRequestPending] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Socket connection state for voice chat
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // Get current username - prioritize Clerk user, fall back to location state
    const currentUsername = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || location.state?.username || 'Anonymous';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.languageDropdown')) {
                document.querySelectorAll('.languageMenu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        // Wait for Clerk user to load
        if (!isUserLoaded) return;

        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Unable to connect to the server. Please try again.');
                reactNavigator('/dashboard');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: currentUsername,
            });

            // Mark socket as connected for voice chat
            setIsSocketConnected(true);

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== currentUsername) {
                        toast.success(`${username} has joined the workspace.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                    // Sync language to new user
                    socketRef.current.emit(ACTIONS.SYNC_LANGUAGE, {
                        language: selectedLanguage,
                        socketId,
                    });
                    // Sync input to new user
                    socketRef.current.emit(ACTIONS.SYNC_INPUT, {
                        input: input,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast(`⚠️${username} has left the workspace.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                    // Remove from pending requests if they were waiting
                    setPendingRequests((prev) => prev.filter(r => r.socketId !== socketId));
                }
            );

            // Listen for language changes from other users
            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
                setSelectedLanguage(language);
            });

            // Listen for code output from other users
            socketRef.current.on(ACTIONS.CODE_OUTPUT, ({ output, isError }) => {
                setOutput(output);
                setIsError(isError);
                setIsRunning(false);
                isRunningRef.current = false;
            });

            // Listen for input changes from other users
            socketRef.current.on(ACTIONS.INPUT_CHANGE, ({ input }) => {
                setInput(input);
            });

            // Admin & Access Control Listeners
            socketRef.current.on(ACTIONS.ADMIN_UPDATE, ({ isAdmin, status, readOnly }) => {
                if (isAdmin !== undefined) setIsAdmin(isAdmin);
                if (status) setRoomStatus(status);
                if (readOnly !== undefined) setIsReadOnly(readOnly);
            });

            socketRef.current.on(ACTIONS.JOIN_REQUEST, ({ status }) => {
                if (status === 'waiting') setJoinRequestPending(true);
            });

            socketRef.current.on(ACTIONS.JOIN_DENIED, ({ reason }) => {
                toast.error(reason);
                reactNavigator('/dashboard');
            });

            socketRef.current.on(ACTIONS.JOIN_APPROVED, () => {
                setJoinRequestPending(false);
                toast.success('Join request approved!');
                // Retry join logic
                socketRef.current.emit(ACTIONS.JOIN, { roomId, username: currentUsername });
            });

            // Admin: Listen for join requests
            socketRef.current.on(ACTIONS.REQUEST_JOIN, ({ username, socketId }) => {
                // Add to pending requests list
                setPendingRequests((prev) => {
                    if (prev.find(r => r.socketId === socketId)) return prev;
                    return [...prev, { username, socketId }];
                });

                // Also show a toast notification
                toast((t) => (
                    <div className="joinRequestToast">
                        <p><strong>{username}</strong> wants to join</p>
                        <div className="toastActions">
                            <button
                                className="approveBtn"
                                onClick={() => {
                                    socketRef.current.emit(ACTIONS.JOIN_APPROVED, { socketId, roomId });
                                    setPendingRequests((prev) => prev.filter(r => r.socketId !== socketId));
                                    toast.dismiss(t.id);
                                    toast.success(`${username} has been approved!`);
                                }}>
                                Approve
                            </button>
                            <button
                                className="denyBtn"
                                onClick={() => {
                                    socketRef.current.emit(ACTIONS.JOIN_DENIED, { socketId, roomId });
                                    setPendingRequests((prev) => prev.filter(r => r.socketId !== socketId));
                                    toast.dismiss(t.id);
                                }}>
                                Deny
                            </button>
                        </div>
                    </div>
                ), { duration: Infinity, position: 'top-right' });
            });
        };
        init();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
                socketRef.current.off(ACTIONS.CODE_OUTPUT);
                socketRef.current.off(ACTIONS.INPUT_CHANGE);
                socketRef.current.off(ACTIONS.ADMIN_UPDATE);
                socketRef.current.off(ACTIONS.JOIN_REQUEST);
                socketRef.current.off(ACTIONS.JOIN_DENIED);
                socketRef.current.off(ACTIONS.JOIN_APPROVED);
                socketRef.current.off(ACTIONS.REQUEST_JOIN);
            }
        };
    }, [isUserLoaded, currentUsername, roomId, reactNavigator]);

    // Handle language change
    const handleLanguageChange = useCallback((e) => {
        const language = e.target.value;
        setSelectedLanguage(language);
        // Emit to other users
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
                roomId,
                language,
            });
        }
    }, [roomId]);

    // Handle input change
    const handleInputChange = useCallback((newInput) => {
        setInput(newInput);
        // Emit to other users
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.INPUT_CHANGE, {
                roomId,
                input: newInput,
            });
        }
    }, [roomId]);

    // Handle code execution - prevents duplicate requests
    const handleRunCode = useCallback(async () => {
        // Prevent duplicate requests
        if (isRunningRef.current) {
            return;
        }

        const code = codeRef.current;
        if (!code || code.trim() === '') {
            toast.error('Please write some code first.');
            return;
        }

        isRunningRef.current = true;
        setIsRunning(true);
        setOutput('');
        setIsError(false);

        try {
            const pistonLanguage = getPistonLanguage(selectedLanguage);
            const result = await executeCode(code, pistonLanguage, input);

            setOutput(result.output);
            setIsError(result.isError);

            // Sync output to other users
            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.CODE_OUTPUT, {
                    roomId,
                    output: result.output,
                    isError: result.isError,
                });
            }

            if (result.isError) {
                toast.error('Execution completed with errors.');
            } else {
                toast.success('Code executed successfully!');
            }
        } catch (error) {
            console.error('Execution error:', error);
            setOutput('Error: Failed to execute code');
            setIsError(true);
            toast.error('Failed to execute code.');
        } finally {
            setIsRunning(false);
            isRunningRef.current = false;
        }
    }, [selectedLanguage, roomId, input]);

    // Handle approve request
    const handleApproveRequest = useCallback((socketId, username) => {
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.JOIN_APPROVED, { socketId, roomId });
            setPendingRequests((prev) => prev.filter(r => r.socketId !== socketId));
            toast.success(`${username} has been approved!`);
        }
    }, [roomId]);

    // Handle deny request
    const handleDenyRequest = useCallback((socketId) => {
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.JOIN_DENIED, { socketId, roomId });
            setPendingRequests((prev) => prev.filter(r => r.socketId !== socketId));
        }
    }, [roomId]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied successfully.');
        } catch (err) {
            toast.error('Failed to copy Room ID. Please try again.');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/dashboard');
    }

    // Show loading while Clerk user loads
    if (!isUserLoaded) {
        return (
            <div className="authLoadingWrapper">
                <div className="authLoadingCard">
                    <div className="authLoadingLogo">
                        <img src="/code-sync.png" alt="CodeSync" />
                        <h1 className="logoText">Code<span>Sync</span></h1>
                    </div>
                    <div className="authLoadingSpinner">
                        <div className="spinner large"></div>
                        <p>Loading workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show waiting room for private room requests
    if (joinRequestPending) {
        return (
            <WaitingRoom
                socket={socketRef.current}
                roomId={roomId}
                onApproved={() => setJoinRequestPending(false)}
                onDenied={() => reactNavigator('/dashboard')}
            />
        );
    }

    return (
        <div className="mainWrap">
            {/* Mobile Menu Button */}
            <button
                className="mobileMenuBtn"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="mobileUserCount">{clients.length}</span>
            </button>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebarOverlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className={`aside ${isSidebarOpen ? 'open' : ''}`}>
                {/* Sidebar Header - Logo and Close Button in one row */}
                <div className="sidebarHeader">
                    <div className="navLeft">
                        <img
                            className="navLogo"
                            src="/code-sync.png"
                            alt="CodeSync Logo"
                        />
                        <h1 className="logoText">
                            Code<span>Sync</span>
                        </h1>
                    </div>
                    <button
                        className="mobileCloseBtn"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="asideInner">
                    <h3>Connected Users</h3>

                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <div className="adminControls">
                            <h3>Admin Settings</h3>
                            <div className="controlItem">
                                <label className="checkboxLabel">
                                    <input
                                        type="checkbox"
                                        checked={roomStatus === 'private'}
                                        onChange={(e) => {
                                            const newStatus = e.target.checked ? 'private' : 'public';
                                            socketRef.current.emit(ACTIONS.ADMIN_UPDATE, { roomId, status: newStatus });
                                        }}
                                    />
                                    <span className="checkboxCustom"></span>
                                    Private Room
                                </label>
                            </div>
                            <div className="controlItem">
                                <label className="checkboxLabel">
                                    <input
                                        type="checkbox"
                                        checked={isReadOnly}
                                        onChange={(e) => {
                                            socketRef.current.emit(ACTIONS.ADMIN_UPDATE, { roomId, readOnly: e.target.checked });
                                        }}
                                    />
                                    <span className="checkboxCustom"></span>
                                    Read-Only Mode
                                </label>
                            </div>

                            {/* Pending Requests Section */}
                            {pendingRequests.length > 0 && (
                                <div className="pendingRequests">
                                    <h4>Pending Requests ({pendingRequests.length})</h4>
                                    <div className="requestsList">
                                        {pendingRequests.map((request) => (
                                            <div key={request.socketId} className="requestItem">
                                                <span className="requestName">{request.username}</span>
                                                <div className="requestActions">
                                                    <button
                                                        className="approveBtn small"
                                                        onClick={() => handleApproveRequest(request.socketId, request.username)}
                                                        title="Approve"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="denyBtn small"
                                                        onClick={() => handleDenyRequest(request.socketId)}
                                                        title="Deny"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Voice Chat Controls */}
                {isSocketConnected && (
                    <VoiceRoomProvider
                        socketRef={socketRef}
                        roomId={roomId}
                        username={currentUsername}
                    >
                        <VoiceControls />
                    </VoiceRoomProvider>
                )}

                {/* Sidebar Footer */}
                <div className="sidebarFooter">
                    <div className="sidebarUserProfile">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: 'sidebarAvatar',
                                    userButtonTrigger: 'sidebarUserBtn'
                                }
                            }}
                        />
                        <div className="userInfo">
                            <span className="sidebarUsername">{currentUsername}</span>
                            <span className="userRole">{isAdmin ? 'Admin' : 'Collaborator'}</span>
                        </div>
                    </div>

                    <div className="sidebarActions">
                        <button className="actionBtn" onClick={copyRoomId} title="Copy Room ID">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button className="actionBtn danger" onClick={leaveRoom} title="Leave Workspace">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="editorContainer">
                <div className="editorHeader">
                    <div className="editorTitle">
                        <svg className="codeIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20" fill="currentColor">
                            <path d="M399.1 1.1c-12.7-3.9-26.1 3.1-30 15.8l-144 464c-3.9 12.7 3.1 26.1 15.8 30s26.1-3.1 30-15.8l144-464c3.9-12.7-3.1-26.1-15.8-30zm71.4 118.5c-9.1 9.7-8.6 24.9 1.1 33.9L580.9 256 471.6 358.5c-9.7 9.1-10.2 24.3-1.1 33.9s24.3 10.2 33.9 1.1l128-120c4.8-4.5 7.6-10.9 7.6-17.5s-2.7-13-7.6-17.5l-128-120c-9.7-9.1-24.9-8.6-33.9 1.1zm-301 0c-9.1-9.7-24.3-10.2-33.9-1.1l-128 120C2.7 243 0 249.4 0 256s2.7 13 7.6 17.5l128 120c9.7 9.1 24.9 8.6 33.9-1.1s8.6-24.9-1.1-33.9L59.1 256 168.4 153.5c9.7-9.1 10.2-24.3 1.1-33.9z" />
                        </svg>
                        <span>Code</span>

                        {/* Status badges */}
                        {roomStatus === 'private' && (
                            <span className="roomBadge privateBadge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Private
                            </span>
                        )}
                        {isReadOnly && !isAdmin && (
                            <span className="roomBadge readOnlyBadge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Only
                            </span>
                        )}
                        {isAdmin && (
                            <span className="roomBadge adminBadge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Admin
                            </span>
                        )}
                    </div>
                    <div className="headerControls">
                        <div className="languageDropdown">
                            <button
                                className="languageBtn"
                                onClick={(e) => {
                                    const dropdown = e.currentTarget.nextElementSibling;
                                    dropdown.classList.toggle('show');
                                }}
                            >
                                {SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage)?.name || 'Select'}
                                <span className="dropdownArrow">▼</span>
                            </button>
                            <div className="languageMenu">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        className={`languageOption ${selectedLanguage === lang.id ? 'selected' : ''}`}
                                        onClick={(e) => {
                                            handleLanguageChange({ target: { value: lang.id } });
                                            e.currentTarget.closest('.languageMenu').classList.remove('show');
                                        }}
                                    >
                                        {selectedLanguage === lang.id && <span className="checkmark">✓</span>}
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            className={`btn runBtn ${isRunning ? 'running' : ''}`}
                            onClick={handleRunCode}
                            disabled={isRunning}
                        >
                            {isRunning ? (
                                <>
                                    <span className="spinner"></span>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <span className="playIcon">▶</span>
                                    Run
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="editorWrap">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        language={selectedLanguage}
                        clients={clients}
                        currentUsername={currentUsername}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                        isReadOnly={!isAdmin && isReadOnly}
                    />
                </div>

                <OutputPanel
                    output={output}
                    isError={isError}
                    isRunning={isRunning}
                    input={input}
                    onInputChange={handleInputChange}
                />
            </div>
        </div>
    );
};

export default EditorPage;
