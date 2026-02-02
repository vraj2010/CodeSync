const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/codeController');

// POST /api/execute - Execute code using Piston API
router.post('/execute', executeCode);

module.exports = router;
