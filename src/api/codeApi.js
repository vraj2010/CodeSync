/**
 * API service for code execution via Backend -> Wandbox (No ID/Key)
 * 
 * We use the backend proxy to handle the API call.
 */
import { getWandboxCompiler } from '../utils/languageMapping';

// Detect backend URL based on environment
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BACKEND_URL = isLocalhost ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') : '';

/**
 * Execute code via backend API (which calls Wandbox)
 * @param {string} sourceCode - The code to execute
 * @param {string} language - The programming language identifier (e.g., 'javascript')
 * @param {string} stdin - Standard input for the program (optional)
 * @param {string} token - Clerk session token, sent as a Bearer credential
 * @returns {Promise<{output: string, isError: boolean}>}
 */
export const executeCode = async (sourceCode, language, stdin = '', token = null) => {
    try {
        // Convert language string (e.g., 'javascript') to Wandbox Compiler Name (e.g., 'nodejs-20.17.0')
        const compilerName = getWandboxCompiler(language);

        const response = await fetch(`${BACKEND_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                language: compilerName, // Backend expects 'language' field which is compiler name
                code: sourceCode,
                stdin: stdin,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.output || `Execution failed with status ${response.status}`);
        }

        const data = await response.json();

        return {
            output: data.output || 'No output',
            isError: data.isError || false,
        };
    } catch (error) {
        console.error('Code execution error:', error);
        return {
            output: error.message || 'Error: Unable to connect to the server',
            isError: true,
        };
    }
};


