import React, { useEffect, useRef, useCallback } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
// Language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/go/go';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/php/php';
import 'codemirror/mode/swift/swift';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/lua/lua';
import 'codemirror/mode/perl/perl';
import 'codemirror/mode/r/r';
import 'codemirror/mode/haskell/haskell';
import 'codemirror/mode/dart/dart';
// Addons
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';
import { getCodeMirrorMode } from '../utils/languageMapping';
import { getUserColor } from '../utils/cursorColors';

const Editor = ({ socketRef, roomId, onCodeChange, language = 'javascript', clients = [], currentUsername }) => {
    const editorRef = useRef(null);
    const remoteCursorsRef = useRef({}); // Store remote cursor elements
    const isRemoteChange = useRef(false); // Track if change is from remote

    // Create or update remote cursor element
    const updateRemoteCursor = useCallback((username, position, socketId) => {
        if (!editorRef.current || username === currentUsername) return;

        const editor = editorRef.current;
        const color = getUserColor(username);

        // Remove existing cursor for this user
        if (remoteCursorsRef.current[socketId]) {
            remoteCursorsRef.current[socketId].clear();
        }

        // Create cursor widget
        const cursorElement = document.createElement('div');
        cursorElement.className = 'remote-cursor';
        cursorElement.style.borderLeft = `2px solid ${color}`;
        cursorElement.style.height = '18px';
        cursorElement.style.marginLeft = '-1px';
        cursorElement.style.position = 'relative';
        cursorElement.style.zIndex = '100';

        // Create label - positioned below to avoid being cut off on line 1
        const labelElement = document.createElement('div');
        labelElement.className = 'remote-cursor-label';
        labelElement.textContent = username;
        labelElement.style.backgroundColor = color;
        labelElement.style.color = '#000';
        labelElement.style.fontSize = '10px';
        labelElement.style.fontWeight = '600';
        labelElement.style.padding = '2px 6px';
        labelElement.style.borderRadius = '3px';
        labelElement.style.position = 'absolute';
        labelElement.style.bottom = '-18px';
        labelElement.style.left = '0';
        labelElement.style.whiteSpace = 'nowrap';
        labelElement.style.pointerEvents = 'none';
        labelElement.style.zIndex = '101';

        cursorElement.appendChild(labelElement);

        // Create bookmark at cursor position
        try {
            const bookmark = editor.setBookmark(position, {
                widget: cursorElement,
                insertLeft: true,
            });
            remoteCursorsRef.current[socketId] = bookmark;
        } catch (e) {
            console.error('Error setting cursor bookmark:', e);
        }
    }, [currentUsername]);

    // Remove remote cursor
    const removeRemoteCursor = useCallback((socketId) => {
        if (remoteCursorsRef.current[socketId]) {
            remoteCursorsRef.current[socketId].clear();
            delete remoteCursorsRef.current[socketId];
        }
    }, []);

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: getCodeMirrorMode(language),
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Handle code changes
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);

                if (origin !== 'setValue' && !isRemoteChange.current) {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });

            // Handle cursor changes
            editorRef.current.on('cursorActivity', (instance) => {
                if (socketRef.current && !isRemoteChange.current) {
                    const cursor = instance.getCursor();
                    socketRef.current.emit(ACTIONS.CURSOR_CHANGE, {
                        roomId,
                        position: { line: cursor.line, ch: cursor.ch },
                        username: currentUsername,
                    });
                }
            });
        }
        init();
    }, []);

    // Update mode when language changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setOption('mode', getCodeMirrorMode(language));
        }
    }, [language]);

    // Handle socket events
    useEffect(() => {
        if (socketRef.current) {
            // Handle remote code changes
            const handleCodeChange = ({ code }) => {
                if (code !== null && editorRef.current) {
                    isRemoteChange.current = true;
                    const cursor = editorRef.current.getCursor();
                    editorRef.current.setValue(code);
                    editorRef.current.setCursor(cursor);
                    isRemoteChange.current = false;
                }
            };

            // Handle remote cursor changes
            const handleCursorChange = ({ position, username, socketId }) => {
                if (username !== currentUsername) {
                    updateRemoteCursor(username, position, socketId);
                }
            };

            // Handle user disconnect - remove their cursor
            const handleDisconnect = ({ socketId }) => {
                removeRemoteCursor(socketId);
            };

            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
            socketRef.current.on(ACTIONS.CURSOR_CHANGE, handleCursorChange);
            socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnect);

            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
                socketRef.current.off(ACTIONS.CURSOR_CHANGE, handleCursorChange);
                socketRef.current.off(ACTIONS.DISCONNECTED, handleDisconnect);
            };
        }
    }, [socketRef.current, currentUsername, updateRemoteCursor, removeRemoteCursor]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
