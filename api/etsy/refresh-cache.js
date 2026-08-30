/**
 * Etsy API - Manual Cache Refresh
 * GET /api/etsy/refresh-cache
 * 
 * Manually refresh the product cache on-demand
 * Same logic as cron endpoint, but can be called anytime
 * Requires REFRESH_SECRET in query or header for security
 */

import { setCachedProducts } from './cache.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { logSecurityEvent, logRequest, logError } from '../middleware/logger.js';

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

        // First, try to read shop_id from Redis (set during OAuth authorization)
        let shopId = null;
        try {
            const { createClient } = await import('redis');
            const redis = createClient({ url: process.env.REDIS_URL });
            await redis.connect();
            shopId = await redis.get('mindcubby:shop_id');
            await redis.quit();
            if (shopId) {
                console.log('[Refresh] ✅ Read shop_id from Redis:', shopId);
            }
        } catch (err) {
            console.error('[Refresh] Failed to read shop_id from Redis:', err.message);
        }

        // Fallback to environment variable if Redis fails
        if (!shopId) {
            shopId = process.env.ETSY_SHOP_ID;
            if (shopId) {
                console.log('[Refresh] Using ETSY_SHOP_ID from environment:', shopId);
            }
        }

        if (!shopId) {
            logError(req, 'No shop_id available', { endpoint: '/api/etsy/refresh-cache' });
            return res.status(500).json({
                success: false,
                message: 'No shop_id configured - please authorize first at /api/auth/etsy'
            });
        }

        console.log('[Refresh] Using shop_id for refresh:', shopId);

        // Fetch products using stored refresh token if available
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;
        const xApiKey = `${apiKey}:${apiSecret}`;

        console.log('[Refresh] Fetching listings with shop_id:', shopId);
        console.log('[Refresh] Using API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

        // Try to get a fresh access token using the stored refresh token
        let accessToken = null;
        try {
            const { createClient } = await import('redis');
            const redis = createClient({ url: process.env.REDIS_URL });
            await redis.connect();
            const refreshToken = await redis.get('mindcubby:etsy_refresh_token');
            await redis.quit();

            if (refreshToken) {
                console.log('[Refresh] Found refresh token in Redis, exchanging for access token...');
                const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        client_id: apiKey,
                        refresh_token: refreshToken,
                    }).toString(),
                });

                if (tokenResponse.ok) {
                    const newTokenData = await tokenResponse.json();
                    accessToken = newTokenData.access_token;
                    console.log('[Refresh] ✅ Got fresh access token');
                } else {
                    console.error('[Refresh] Failed to refresh access token');
                }
            }
        } catch (err) {
            console.error('[Refresh] Error getting refresh token:', err.message);
        }

        // Use authenticated endpoint if we have access token, otherwise fall back to public API
        const endpoint = accessToken 
            ? `https://api.etsy.com/v3/application/shops/${shopId}/listings?includes=images`
            : `https://api.etsy.com/v3/public/shops/${shopId}/listings?includes=images`;
        
        const headers = accessToken 
            ? {
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': xApiKey,
                'Content-Type': 'application/json',
              }
            : {
                'x-api-key': xApiKey,
                'Content-Type': 'application/json',
              };

        console.log('[Refresh] Using endpoint:', endpoint.includes('/application/') ? 'authenticated' : 'public');

        const listingsResponse = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (!listingsResponse.ok) {
            const error = await listingsResponse.text();
            console.error('[Refresh] HTTP Status:', listingsResponse.status);
            console.error('[Refresh] Failed to fetch listings:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch listings from Etsy API',
                status: listingsResponse.status,
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
