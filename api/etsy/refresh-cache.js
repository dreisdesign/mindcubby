/**
 * Etsy API - Manual Cache Refresh
 * GET /api/etsy/refresh-cache
 * 
 * Manually refresh the product cache on-demand
 * Same logic as cron endpoint, but can be called anytime
 * Requires REFRESH_SECRET in query or header for security
 */

import { createClient } from 'redis';
import { setCachedProducts } from './cache.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { logSecurityEvent, logRequest, logError } from '../middleware/logger.js';

const SHOP_ID_KEY = 'mindcubby:shop_id';

export default async function handler(req, res) {
    const startTime = Date.now();

    // Rate limit: 10 refresh attempts per IP per hour (prevent abuse)
    if (!checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 })) {
        logSecurityEvent(req, 'RATE_LIMITED', { endpoint: '/api/etsy/refresh-cache' });
        return res.status(429).json({ error: 'Too many refresh requests - rate limited' });
    }

    try {
        // Verify request has refresh secret
        const refreshSecret = req.query.secret || req.headers['x-refresh-secret'];
        const expectedSecret = process.env.REFRESH_SECRET;

        if (!expectedSecret || !refreshSecret || refreshSecret !== expectedSecret) {
            logSecurityEvent(req, 'REFRESH_AUTH_FAILED', {
                endpoint: '/api/etsy/refresh-cache',
                reason: !refreshSecret ? 'missing_secret' : 'invalid_secret'
            });
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid refresh secret'
            });
        }

        logSecurityEvent(req, 'REFRESH_INITIATED', { endpoint: '/api/etsy/refresh-cache' });
        console.log('[Refresh] Manual cache refresh triggered');

        // Get shop_id from Redis
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();
        const shopId = await redis.get(SHOP_ID_KEY);
        await redis.quit();

        if (!shopId) {
            logError(req, 'No shop_id found', { endpoint: '/api/etsy/refresh-cache' });
            return res.status(400).json({
                success: false,
                message: 'No shop_id stored - please authorize at /api/auth/etsy first'
            });
        }

        console.log('[Refresh] Found shop_id:', shopId);

        // Fetch products using app credentials (public API endpoint)
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;
        const xApiKey = `${apiKey}:${apiSecret}`;

        const listingsResponse = await fetch(
            `https://api.etsy.com/v3/public/shops/${shopId}/listings?includes=images`,
            {
                method: 'GET',
                headers: {
                    'x-api-key': xApiKey,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!listingsResponse.ok) {
            const error = await listingsResponse.text();
            console.error('[Refresh] Failed to fetch listings:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch listings from Etsy API',
                error: error
            });
        }

        const listingsData = await listingsResponse.json();

        if (listingsData.results && listingsData.results.length > 0) {
            await setCachedProducts(listingsData.results);
            console.log('[Refresh] ✅ Successfully cached', listingsData.results.length, 'products');

            const duration = Date.now() - startTime;
            logRequest(req, res, {
                status: 200,
                endpoint: '/api/etsy/refresh-cache',
                productCount: listingsData.results.length,
                success: true,
                duration
            });

            return res.status(200).json({
                success: true,
                message: 'Cache refreshed successfully',
                product_count: listingsData.results.length,
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('[Refresh] No products found for shop_id:', shopId);
            const duration = Date.now() - startTime;
            logRequest(req, res, {
                status: 200,
                endpoint: '/api/etsy/refresh-cache',
                productCount: 0,
                success: false,
                duration
            });

            return res.status(200).json({
                success: false,
                message: 'No products found for this shop',
                product_count: 0
            });
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        logError(req, 'Manual refresh error', {
            error,
            endpoint: '/api/etsy/refresh-cache',
            duration
        });
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
