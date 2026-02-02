/**
 * API service for code execution
 * Calls backend /api/execute endpoint (NOT Piston directly)
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Execute code via backend API
 * @param {string} sourceCode - The code to execute
 * @param {string} language - The programming language
 * @returns {Promise<{output: string, isError: boolean}>}
 */
export const executeCode = async (sourceCode, language) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language,
                code: sourceCode,
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
