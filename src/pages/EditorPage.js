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
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <div className="logo">
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
                        </div>
                    </div>

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
                    <div className="languageSelector">
                        <label htmlFor="language">Language:</label>
                        <select
                            id="language"
                            className="languageSelect"
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
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
                                Run Code
                            </>
                        )}
                    </button>
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
