const axios = require('axios');

// Wandbox API (Free, Public, No Key)
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

// Cap on each of code and stdin before anything is forwarded upstream.
const MAX_FIELD_LENGTH = 20 * 1024; // 20 KB

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

    // Buffer.byteLength, not String.length: the latter counts UTF-16 code units,
    // which understates the real size of any multi-byte source we forward.
    const codeBytes = Buffer.byteLength(code, 'utf8');
    if (codeBytes > MAX_FIELD_LENGTH) {
        return res.status(413).json({
            output: `Error: Code is too large (${codeBytes} bytes). The limit is ${MAX_FIELD_LENGTH} bytes.`,
            isError: true
        });
    }

    if (typeof stdin === 'string') {
        const stdinBytes = Buffer.byteLength(stdin, 'utf8');
        if (stdinBytes > MAX_FIELD_LENGTH) {
            return res.status(413).json({
                output: `Error: Input is too large (${stdinBytes} bytes). The limit is ${MAX_FIELD_LENGTH} bytes.`,
                isError: true
            });
        }
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
