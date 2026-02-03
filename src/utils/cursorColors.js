/**
 * Utility functions for collaborative cursor colors
 */

// Vibrant colors for cursors - easy to distinguish
const CURSOR_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#F38181', // Coral
    '#AA96DA', // Purple
    '#FCBAD3', // Pink
    '#A8D8EA', // Light Blue
    '#FF9F43', // Orange
    '#6C5CE7', // Indigo
    '#00B894', // Green
    '#E84393', // Magenta
    '#0984E3', // Blue
    '#FDCB6E', // Gold
    '#00CEC9', // Cyan
];

/**
 * Get a consistent color for a username
 * Uses hash of username to always return same color for same user
 */
export const getUserColor = (username) => {
    if (!username) return CURSOR_COLORS[0];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % CURSOR_COLORS.length;
    return CURSOR_COLORS[index];
};

/**
 * Generate CSS for remote cursor
 */
export const getCursorStyle = (color) => ({
    backgroundColor: color,
    position: 'absolute',
    width: '2px',
    height: '18px',
    zIndex: 100,
});

/**
 * Generate CSS for cursor label
 */
export const getCursorLabelStyle = (color) => ({
    backgroundColor: color,
    color: '#000',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '3px',
    position: 'absolute',
    top: '-20px',
    left: '0',
    whiteSpace: 'nowrap',
    zIndex: 101,
});
