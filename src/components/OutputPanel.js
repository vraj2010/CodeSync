import React, { useState } from 'react';

const OutputPanel = ({ output, isError, isRunning, input, onInputChange }) => {
    const [showInput, setShowInput] = useState(false);

    return (
        <div className="outputPanel">
            <div className="outputHeader">
                <div className="outputTabs">
                    <button
                        className={`outputTab ${showInput ? 'active' : ''}`}
                        onClick={() => setShowInput(true)}
                    >
                        Input (stdin)
                    </button>
                    <button
                        className={`outputTab ${!showInput ? 'active' : ''}`}
                        onClick={() => setShowInput(false)}
                    >
                        Output
                    </button>
                </div>
                {isRunning && (
                    <span className="runningIndicator">
                        <span className="spinner"></span>
                        Running...
                    </span>
                )}
            </div>

            {showInput ? (
                <div className="inputContent">
                    <textarea
                        className="stdinInput"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Enter input for your program here (e.g., for cin>>, scanf, input())
One value per line, or space-separated for multiple inputs

Example:
5
hello
10 20 30"
                        disabled={isRunning}
                    />
                    <div className="inputHelp">
                        <span className="inputHelpIcon">💡</span>
                        <span>Works with all languages: C++ (cin), C (scanf), Python (input), Java (Scanner), etc.</span>
                    </div>
                </div>
            ) : (
                <div className={`outputContent ${isError ? 'error' : ''}`}>
                    {isRunning ? (
                        <div className="outputPlaceholder">
                            <span className="spinner large"></span>
                            <span>Executing code...</span>
                        </div>
                    ) : output ? (
                        <pre>{output}</pre>
                    ) : (
                        <div className="outputPlaceholder">
                            Run your code to see output here
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutputPanel;
