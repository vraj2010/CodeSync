const axios = require('axios');

// Wandbox API (Free, Public, No Key)
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

/**
 * Execute code using Wandbox API
 * POST /api/execute
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const executeCode = async (req, res) => {
    const { language, code, stdin } = req.body;

    // Validation
    if (!language) {
        return res.status(400).json({
            output: 'Error: Language compiler name is required',
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
        const payload = {
            compiler: language,  // Wandbox expects 'compiler' field
            code: code,
            stdin: stdin || ''
        };

        const response = await axios.post(WANDBOX_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 seconds timeout
        });

        const data = response.data;

        // Combine outputs
        let output = '';

        // Compiler output (warnings/errors)
        if (data.compiler_output) output += data.compiler_output + '\n';
        if (data.compiler_error) output += data.compiler_error + '\n';

        // Program output
        if (data.program_output) output += data.program_output;
        if (data.program_error) output += (output ? '\n' : '') + data.program_error;
        if (data.program_message) output += (output ? '\n' : '') + data.program_message;

        // Signal output (e.g. killed)
        if (data.signal) output += (output ? '\n' : '') + `Signal: ${data.signal}`;

        // Status 0 means success
        const isError = data.status !== '0';

        return res.json({
            output: output || 'No output',
            isError: isError
        });

    } catch (error) {
        console.error('Wandbox API Error:', error.message);
        if (error.response) {
            console.error('Wandbox Response:', error.response.data);
            return res.status(error.response.status).json({
                output: `Error: ${error.response.data?.message || 'Execution failed on Wandbox'}`,
                isError: true
            });
        }
        return res.status(500).json({
            output: 'Server error: Unable to execute code. Please try again.',
            isError: true
        });
    }
};

module.exports = { executeCode };
