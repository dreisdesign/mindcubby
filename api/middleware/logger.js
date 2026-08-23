/**
 * Structured Logging Utility
 * JSON-formatted logs for better searchability and monitoring
 * 
 * Usage:
 * import { logRequest, logError } from './logger.js';
 * 
 * logRequest(req, res, { endpoint: '/api/etsy/cache', duration: 123 });
 * logError(req, 'Cache fetch failed', { error: err.message });
 */

/**
 * Extract client IP from request
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
 * Log successful API request
 */
export function logRequest(req, res, metadata = {}) {
    const log = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        method: req.method,
        endpoint: req.url,
        status: res.statusCode,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        ...metadata
    };

    console.log(JSON.stringify(log));
}

/**
 * Log error with context
 */
export function logError(req, message, error = {}) {
    const log = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        method: req.method,
        endpoint: req.url,
        ip: getClientIp(req),
        message,
        error: error.message || String(error),
        errorCode: error.code || 'UNKNOWN'
    };

    console.error(JSON.stringify(log));
}

/**
 * Log security event (auth failure, rate limit, etc.)
 */
export function logSecurityEvent(req, eventType, details = {}) {
    const log = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        event: eventType,
        method: req.method,
        endpoint: req.url,
        ip: getClientIp(req),
        ...details
    };

    console.warn(JSON.stringify(log));
}

/**
 * Log debug information (only in development)
 */
export function logDebug(message, data = {}) {
    if (process.env.DEBUG === 'true') {
        const log = {
            timestamp: new Date().toISOString(),
            level: 'DEBUG',
            message,
            ...data
        };

        console.log(JSON.stringify(log));
    }
}
