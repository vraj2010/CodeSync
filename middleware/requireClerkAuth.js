const { verifyClerkToken } = require('../utils/clerkAuth');

/**
 * Express middleware requiring a valid Clerk session token in the
 * `Authorization: Bearer <token>` header.
 *
 * On success sets `req.auth = { userId, sessionId }` and calls next().
 * On failure responds 401 and does NOT call next().
 */
const requireClerkAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    try {
        const payload = await verifyClerkToken(token);
        req.auth = { userId: payload.sub, sessionId: payload.sid };
        return next();
    } catch (error) {
        console.warn(
            `API auth rejected: ${error.message} | token present: ${!!token}`
        );
        return res.status(401).json({
            output: 'Error: Authentication required. Please sign in and try again.',
            isError: true,
        });
    }
};

module.exports = requireClerkAuth;
