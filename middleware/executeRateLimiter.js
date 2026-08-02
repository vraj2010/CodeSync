const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

/**
 * Rate limits POST /api/execute.
 *
 * Keyed on the Clerk user id so the quota follows the account rather than the
 * network - otherwise everyone behind one NAT/campus IP shares a single bucket.
 * Falls back to the IP for any request that somehow reaches this without auth.
 */
const executeRateLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    // ipKeyGenerator() normalises IPv6 to a subnet; returning a raw req.ip
    // would let a single client cycle addresses within its /64 to evade limits.
    keyGenerator: (req) => req.auth?.userId || ipKeyGenerator(req.ip),
    handler: (req, res) => {
        return res.status(429).json({
            output: `Error: Too many execution requests. You can run up to ${MAX_REQUESTS} programs per minute - please wait a moment and try again.`,
            isError: true,
        });
    },
});

module.exports = executeRateLimiter;
