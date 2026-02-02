import React from 'react';

const OutputPanel = ({ output, isError, isRunning }) => {
    return (
        <div className="outputPanel">
            <div className="outputHeader">
                <span className="outputTitle">Output</span>
                {isRunning && (
                    <span className="runningIndicator">
                        <span className="spinner"></span>
                        Running...
                    </span>
                )}
            </div>
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
        </div>
    );
};

export default OutputPanel;
