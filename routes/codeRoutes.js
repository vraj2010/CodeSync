const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/codeController');

// POST /api/execute - Execute code using Wandbox API
router.post('/execute', executeCode);

module.exports = router;
