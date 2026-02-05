import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import OutputPanel from '../components/OutputPanel';
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

    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Code execution state
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isError, setIsError] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const isRunningRef = useRef(false); // Prevent duplicate requests

    // Input state for stdin
    const [input, setInput] = useState('');

    // Get current username
    const currentUsername = location.state?.username;

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
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Unable to connect to the server. Please try again.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: currentUsername,
            });

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
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
            socketRef.current.off(ACTIONS.CODE_OUTPUT);
            socketRef.current.off(ACTIONS.INPUT_CHANGE);
        };
    }, []);

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
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
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
                </div>

                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy Room ID
                </button>

                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave Workspace
                </button>
            </div>

            <div className="editorContainer">
                <div className="editorHeader">
                    <div className="editorTitle">
                        <svg className="codeIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20" fill="currentColor">
                            <path d="M399.1 1.1c-12.7-3.9-26.1 3.1-30 15.8l-144 464c-3.9 12.7 3.1 26.1 15.8 30s26.1-3.1 30-15.8l144-464c3.9-12.7-3.1-26.1-15.8-30zm71.4 118.5c-9.1 9.7-8.6 24.9 1.1 33.9L580.9 256 471.6 358.5c-9.7 9.1-10.2 24.3-1.1 33.9s24.3 10.2 33.9 1.1l128-120c4.8-4.5 7.6-10.9 7.6-17.5s-2.7-13-7.6-17.5l-128-120c-9.7-9.1-24.9-8.6-33.9 1.1zm-301 0c-9.1-9.7-24.3-10.2-33.9-1.1l-128 120C2.7 243 0 249.4 0 256s2.7 13 7.6 17.5l128 120c9.7 9.1 24.9 8.6 33.9-1.1s8.6-24.9-1.1-33.9L59.1 256 168.4 153.5c9.7-9.1 10.2-24.3 1.1-33.9z" />
                        </svg>
                        <span>Code</span>
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
