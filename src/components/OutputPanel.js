import React from 'react';

const OutputPanel = ({ output, isError, isRunning, input, onInputChange }) => {
    return (
        <div className="splitPanelContainer">
            {/* Input Panel - Left Side (50%) */}
            <div className="splitPane inputPane">
                <div className="paneHeader">
                    <span className="paneTitle">Input</span>
                </div>
                <div className="paneContent">
                    <textarea
                        className="stdinTextarea"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Enter input values here..."
                        disabled={isRunning}
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="splitDivider" />

            {/* Output Panel - Right Side (50%) */}
            <div className="splitPane outputPane">
                <div className="paneHeader">
                    <span className="paneTitle">
                        Output
                        {isRunning && (
                            <span className="runningBadge">
                                <span className="spinner small"></span>
                            </span>
                        )}
                    </span>
                </div>
                <div className={`paneContent ${isError ? 'error' : ''}`}>
                    {isRunning ? (
                        <div className="outputPlaceholder">
                            <span className="spinner large"></span>
                            <span>Executing code...</span>
                        </div>
                    ) : output ? (
                        <pre className="outputText">{output}</pre>
                    ) : (
                        <div className="outputPlaceholder">
                            <span className="placeholderIcon">▶</span>
                            <span>Run your code to see output</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OutputPanel;
