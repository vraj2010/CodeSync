const axios = require('axios');

// Piston API endpoint
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * Execute code using the Piston API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const executeCode = async (req, res) => {
    const { language, code, stdin } = req.body;

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
            ],
            // Add stdin for user input
            stdin: stdin || '',
            // Execution options
            run_timeout: 10000, // 10 seconds timeout
            compile_timeout: 10000,
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout for the HTTP request
        });

        const { run, compile } = response.data;

        // Check for compile errors first
        if (compile && compile.stderr && compile.stderr.trim() !== '') {
            return res.json({
                output: `Compilation Error:\n${compile.stderr}`,
                isError: true
            });
        }

        // Check if there's an error in stderr or if the exit code is non-zero
        const hasError = (run.stderr && run.stderr.trim() !== '') || run.code !== 0;

        // Combine stdout and stderr for complete output
        let output = '';
        if (run.stdout) output += run.stdout;
        if (run.stderr) output += (output ? '\n' : '') + run.stderr;

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
