const { verifyToken } = require('@clerk/backend');

// Read lazily rather than caching at module load, so this file is not
// sensitive to being required before dotenv.config() runs.
const getSecretKey = () => process.env.CLERK_SECRET_KEY;

if (!getSecretKey()) {
    console.warn(
        'Warning: CLERK_SECRET_KEY is not set. Every authenticated request and socket connection will be rejected.'
    );
}

/**
 * Verifies a Clerk session token (JWT) issued to the browser by Clerk.
 * @param {string} token - The raw session JWT.
 * @returns {Promise<object>} The decoded JWT payload (contains `sub`, `sid`, ...).
 * @throws {Error} If the token is missing, malformed, expired, or otherwise invalid.
 */
const verifyClerkToken = async (token) => {
    if (!token) {
        throw new Error('Token is required');
    }

    const secretKey = getSecretKey();

    if (!secretKey) {
        throw new Error('Server is missing CLERK_SECRET_KEY');
    }

    // The top-level verifyToken export is wrapped in withLegacyReturn: it
    // resolves to the JwtPayload directly and throws on failure. Do NOT
    // destructure { data, errors } here - that shape belongs to the internal
    // tokens/verify entry point, and destructuring it off the payload silently
    // yields undefined.
    return await verifyToken(token, { secretKey });
};

module.exports = { verifyClerkToken };
