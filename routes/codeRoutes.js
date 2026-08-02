const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/codeController');
const requireClerkAuth = require('../middleware/requireClerkAuth');
const executeRateLimiter = require('../middleware/executeRateLimiter');

// POST /api/execute - Execute code using Wandbox API (requires a Clerk session).
// Auth runs first so the rate limiter can key on req.auth.userId.
router.post('/execute', requireClerkAuth, executeRateLimiter, executeCode);

module.exports = router;
