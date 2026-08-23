# Middleware

Reusable utility modules for common API functionality.

## rate-limit.js

In-memory rate limiter using client IP address.

**Features:**
- Tracks requests per IP
- Configurable max requests and time window
- Vercel-aware (handles x-forwarded-for headers)
- Lightweight (no external dependencies)

**Usage:**
```javascript
import { checkRateLimit } from '../middleware/rate-limit.js';

// In your handler
if (!checkRateLimit(req, { maxRequests: 100, windowMs: 15 * 60 * 1000 })) {
    return res.status(429).json({ error: 'Too many requests' });
}
```

**Current Limits:**
- Public `/api/etsy/cache`: 100 requests per 15 minutes
- OAuth `/api/auth/etsy`: 20 attempts per 15 minutes  
- Refresh `/api/etsy/refresh-cache`: 10 attempts per hour

**Maintenance:**
```javascript
import { cleanupRateLimitStore } from '../middleware/rate-limit.js';

// Call periodically to clean expired entries (optional, prevents memory leak)
cleanupRateLimitStore();
```

---

## logger.js

Structured JSON logging for monitoring and debugging.

**Functions:**

### logRequest(req, res, metadata)
Log successful API requests with metrics.
```javascript
logRequest(req, res, { 
    endpoint: '/api/etsy/cache',
    cached: true,
    productCount: 17,
    duration: 123
});
// Output: {"timestamp":"2026-08-23T...", "level":"INFO", "status":200, ...}
```

### logError(req, message, error)
Log errors with context.
```javascript
logError(req, 'Cache fetch failed', { error: err, endpoint: '/api/etsy/cache' });
// Output: {"timestamp":"2026-08-23T...", "level":"ERROR", ...}
```

### logSecurityEvent(req, eventType, details)
Log security events (auth failures, rate limits, etc).
```javascript
logSecurityEvent(req, 'AUTH_FAILED', { reason: 'invalid_token' });
// Output: {"timestamp":"2026-08-23T...", "level":"WARN", "event":"AUTH_FAILED", ...}
```

### logDebug(message, data)
Debug logging (only when DEBUG=true env var set).
```javascript
logDebug('Cache lookup', { key: CACHE_KEY });
// Output: (only in development)
```

**Log Levels:**
- `INFO` - Successful requests
- `WARN` - Security events
- `ERROR` - Error conditions
- `DEBUG` - Development debugging (DEBUG=true only)

**Log Fields:**
- `timestamp` - ISO 8601 timestamp
- `level` - Log level (INFO, WARN, ERROR, DEBUG)
- `ip` - Client IP address
- `method` - HTTP method
- `endpoint` - API endpoint
- `status` - HTTP status code (if available)
- `duration` - Request duration in ms (if provided)

**Viewing Logs:**
All logs are output to stdout in JSON format. View in Vercel dashboard:
- **Vercel Console:** Settings → Monitoring → Function Logs
- **Local:** `npm run logs` (if available)
- **Grep:** `grep '"level":"ERROR"' logs.json` (in exported logs)

---

## Future Improvements

- [ ] Add distributed rate limiting (Redis-based, for multi-instance deployments)
- [ ] Add structured log export (to external service like DataDog)
- [ ] Add performance profiling middleware
- [ ] Add request ID tracking for debugging
