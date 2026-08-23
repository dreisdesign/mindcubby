/**
 * Health Check Endpoint
 * GET /api/health-check
 * 
 * Validates system health:
 * - Cache exists and has products
 * - Cache is not expired
 * - shop_id is stored
 * - Products count > 0
 * 
 * Returns status and logs failures to Redis with email notification
 */

import { createClient } from 'redis';
import { getCachedProducts } from './etsy/cache.js';
import { sendAlert } from './notifications.js';

export default async function handler(req, res) {
    const checks = {
        cache_exists: false,
        cache_not_expired: false,
        shop_id_stored: false,
        product_count: 0,
        timestamp: new Date().toISOString(),
        errors: []
    };

    try {
        // Check 1: Cache exists and has products
        const cache = await getCachedProducts();
        if (!cache) {
            checks.errors.push('No cache found in Redis');
        } else {
            checks.cache_exists = true;
            checks.product_count = cache.count || 0;

            // Check 2: Cache not expired (24 hour TTL)
            const now = Date.now();
            const cacheAge = now - cache.timestamp;
            const ttl = 24 * 60 * 60 * 1000; // 24 hours
            if (cacheAge < ttl) {
                checks.cache_not_expired = true;
            } else {
                checks.errors.push(`Cache expired ${Math.round(cacheAge / 1000 / 60)} minutes ago`);
            }
        }

        // Check 3: shop_id stored in Redis
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();
        const shopId = await redis.get('mindcubby:shop_id');
        await redis.quit();

        if (shopId) {
            checks.shop_id_stored = true;
        } else {
            checks.errors.push('No shop_id stored in Redis - user must authorize first');
        }

        // Check 4: Product count
        if (checks.product_count === 0) {
            checks.errors.push('No products in cache');
        }

        // Determine overall status
        const isHealthy = checks.cache_exists &&
            checks.cache_not_expired &&
            checks.shop_id_stored &&
            checks.product_count > 0 &&
            checks.errors.length === 0;

        checks.healthy = isHealthy;

        // Log status to Redis for monitoring
        try {
            const redis = createClient({ url: process.env.REDIS_URL });
            await redis.connect();
            await redis.setEx(
                'mindcubby:last_health_check',
                7 * 24 * 60 * 60, // 7 days TTL
                JSON.stringify(checks)
            );
            await redis.quit();
        } catch (err) {
            console.error('[Health] Failed to log health check:', err.message);
        }

        // Send alert if unhealthy
        if (!isHealthy && checks.errors.length > 0) {
            await sendAlert({
                subject: '⚠️ MindCubby Shop Health Check Failed',
                errors: checks.errors,
                checks: checks
            }).catch(err => {
                console.error('[Health] Failed to send alert:', err.message);
                // Don't fail the health check endpoint if email fails
            });
        }

        // Return status
        return res.status(isHealthy ? 200 : 503).json(checks);

    } catch (error) {
        console.error('[Health] Unexpected error:', error);
        return res.status(500).json({
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
