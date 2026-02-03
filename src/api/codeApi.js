/**
 * API service for code execution
 * Calls backend /api/execute endpoint (NOT Piston directly)
 */

// Detect backend URL based on environment
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BACKEND_URL = isLocalhost ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') : '';

/**
 * Execute code via backend API
 * @param {string} sourceCode - The code to execute
 * @param {string} language - The programming language
 * @param {string} stdin - Standard input for the program
 * @returns {Promise<{output: string, isError: boolean}>}
 */
export const executeCode = async (sourceCode, language, stdin = '') => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language,
                code: sourceCode,
                stdin: stdin,
            }),
        });

        const data = await response.json();

        return {
            output: data.output || 'No output',
            isError: data.isError || false,
        };
    } catch (error) {
        console.error('Code execution error:', error);
        return {
            output: 'Error: Unable to connect to the server',
            isError: true,
        };
    }
};
