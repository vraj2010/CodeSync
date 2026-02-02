const axios = require('axios');

// Piston API endpoint
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * Execute code using the Piston API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const executeCode = async (req, res) => {
    const { language, code } = req.body;

    // Validation
    if (!language) {
        return res.status(400).json({
            output: 'Error: Language is required',
            isError: true
        });
    }

    if (!code || code.trim() === '') {
        return res.status(400).json({
            output: 'Error: Code is required',
            isError: true
        });
    }

    try {
        const response = await axios.post(PISTON_API_URL, {
            language: language,
            version: '*',
            files: [
                { content: code }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        const { run } = response.data;

        // Check if there's an error in stderr or if the exit code is non-zero
        const hasError = run.stderr && run.stderr.trim() !== '';
        const output = hasError ? run.stderr : run.stdout;

        return res.json({
            output: output || 'No output',
            isError: hasError
        });

    } catch (error) {
        console.error('Piston API Error:', error.message);

        // Handle different error types
        if (error.response) {
            // Piston API returned an error
            return res.status(error.response.status).json({
                output: error.response.data?.message || 'Execution failed',
                isError: true
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                output: 'Execution timed out',
                isError: true
            });
        } else {
            return res.status(500).json({
                output: 'Server error: Unable to execute code',
                isError: true
            });
        }
    }
};

module.exports = { executeCode };
