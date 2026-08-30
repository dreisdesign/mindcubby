/**
 * Etsy API - Cron Cache Refresh
 * Runs automatically via Vercel Cron at 00:00 UTC daily
 * Refreshes product cache using hardcoded shop_id (62670465)
 * 
 * No manual intervention needed - fully autonomous
 */

import { setCachedProducts } from './cache.js';

export const vercelCronSchedule = '0 0 * * *'; // Daily at 00:00 UTC

export default async function handler(req, res) {
    try {
        // Verify this is a Vercel Cron request (security check)
        const vercelCronSecret = req.headers['x-vercel-cron-secret'];
        if (!vercelCronSecret) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'This endpoint only accepts Vercel Cron requests'
            });
        }

        console.log('[Cron] Starting daily cache refresh at', new Date().toISOString());

        // First, try to read shop_id from Redis (set during OAuth authorization)
        let shopId = null;
        try {
            const { createClient } = await import('redis');
            const redis = createClient({ url: process.env.REDIS_URL });
            await redis.connect();
            shopId = await redis.get('mindcubby:shop_id');
            await redis.quit();
            if (shopId) {
                console.log('[Cron] ✅ Read shop_id from Redis:', shopId);
            }
        } catch (err) {
            console.error('[Cron] Failed to read shop_id from Redis:', err.message);
        }

        // Fallback to environment variable if Redis fails
        if (!shopId) {
            shopId = process.env.ETSY_SHOP_ID;
            if (shopId) {
                console.log('[Cron] Using ETSY_SHOP_ID from environment:', shopId);
            }
        }

        if (!shopId) {
            console.error('[Cron] No shop_id available (not in Redis and ETSY_SHOP_ID not set)');
            return res.status(500).json({
                success: false,
                message: 'No shop_id configured - please authorize first at /api/auth/etsy'
            });
        }

        console.log('[Cron] Using shop_id for refresh:', shopId);

        // Fetch products using stored refresh token if available
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;
        const xApiKey = `${apiKey}:${apiSecret}`;

        console.log('[Cron] Fetching listings with shop_id:', shopId);
        console.log('[Cron] Using API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

        // Try to get a fresh access token using the stored refresh token
        let accessToken = null;
        try {
            const { createClient } = await import('redis');
            const redis = createClient({ url: process.env.REDIS_URL });
            await redis.connect();
            const refreshToken = await redis.get('mindcubby:etsy_refresh_token');
            await redis.quit();

            if (refreshToken) {
                console.log('[Cron] Found refresh token in Redis, exchanging for access token...');
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
                    console.log('[Cron] ✅ Got fresh access token');
                } else {
                    console.error('[Cron] Failed to refresh access token');
                }
            }
        } catch (err) {
            console.error('[Cron] Error getting refresh token:', err.message);
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

        console.log('[Cron] Using endpoint:', endpoint.includes('/application/') ? 'authenticated' : 'public');

        const listingsResponse = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (!listingsResponse.ok) {
            const error = await listingsResponse.text();
            console.error('[Cron] HTTP Status:', listingsResponse.status);
            console.error('[Cron] Failed to fetch listings:', error);
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
            console.log('[Cron] ✅ Successfully cached', listingsData.results.length, 'products');

            // Run health check after successful refresh
            console.log('[Cron] Running health check...');
            try {
                const healthResponse = await fetch('https://mindcubby.com/api/health-check');
                const healthData = await healthResponse.json();
                console.log('[Cron] Health check:', healthData.healthy ? '✅ Healthy' : '❌ Unhealthy');
            } catch (err) {
                console.error('[Cron] Health check failed:', err.message);
            }

            return res.status(200).json({
                success: true,
                message: 'Cache refreshed successfully',
                product_count: listingsData.results.length,
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('[Cron] No products found for shop_id:', shopId);
            return res.status(200).json({
                success: false,
                message: 'No products found for this shop',
                product_count: 0
            });
        }

    } catch (error) {
        console.error('[Cron] Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
