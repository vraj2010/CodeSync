const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/codeController');
const requireClerkAuth = require('../middleware/requireClerkAuth');

// POST /api/execute - Execute code using Wandbox API (requires a Clerk session)
router.post('/execute', requireClerkAuth, executeCode);

module.exports = router;
