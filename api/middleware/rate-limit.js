/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter using IP address
 * 
 * Usage:
 * import { checkRateLimit } from './rate-limit.js';
 * 
 * if (!checkRateLimit(req, { maxRequests: 100, windowMs: 15 * 60 * 1000 })) {
 *   return res.status(429).json({ error: 'Too many requests' });
 * }
 */

// In-memory store: { ip: { count, resetTime } }
const rateLimitStore = new Map();

/**
 * Extract client IP from request
 * Accounts for Vercel forwarding headers
 */
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        'unknown'
    );
}

/**
 * Check if request should be rate limited
 * 
 * @param {Object} req - Vercel request object
 * @param {Object} options - Rate limit options
 * @param {number} options.maxRequests - Max requests allowed (default: 100)
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 min)
 * @returns {boolean} true if request is allowed, false if rate limited
 */
export function checkRateLimit(req, options = {}) {
    const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options;
    const ip = getClientIp(req);
    const now = Date.now();

    const entry = rateLimitStore.get(ip);

    // New IP or window expired
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(ip, {
            count: 1,
            resetTime: now + windowMs
        });
        return true;
    }

    // Increment count
    entry.count++;
    if (entry.count > maxRequests) {
        return false; // Rate limited
    }

    return true; // Allowed
}

/**
 * Get current rate limit stats for an IP (for monitoring)
 */
export function getRateLimitStats(req) {
    const ip = getClientIp(req);
    const entry = rateLimitStore.get(ip);
    
    if (!entry) {
        return { ip, requests: 0, resetIn: 'N/A' };
    }

    const now = Date.now();
    const resetIn = entry.resetTime - now;
    
    return {
        ip,
        requests: entry.count,
        resetIn: resetIn > 0 ? `${Math.ceil(resetIn / 1000)}s` : 'expired'
    };
}

/**
 * Clear old entries from store (call periodically to prevent memory leak)
 * Optional: call this from a cron job every hour
 */
export function cleanupRateLimitStore() {
    const now = Date.now();
    let removed = 0;
    
    for (const [ip, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(ip);
            removed++;
        }
    }
    
    return { removed, remaining: rateLimitStore.size };
}
