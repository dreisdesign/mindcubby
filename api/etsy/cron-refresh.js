/**
 * Etsy API - Cron Cache Refresh (Simplified & Resilient)
 * Runs automatically via Vercel Cron at 00:00 UTC daily
 * 
 * Strategy: Use PUBLIC Etsy API endpoint (no auth tokens needed)
 * - Only requires ETSY_API_KEY:ETSY_API_SECRET header
 * - No dependency on Redis refresh tokens (removes single point of failure)
 * - Falls back gracefully if Redis is unavailable
 * 
 * Sends email alerts on failure
 */

import { setCachedProducts } from './cache.js';
import { sendAlert } from '../notifications.js';

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

        // Get shop_id (required for all API calls)
        let shopId = process.env.ETSY_SHOP_ID;
        
        // Try to read shop_id from Redis first (may be more up-to-date if user re-authorized)
        if (process.env.REDIS_URL) {
            try {
                const { createClient } = await import('redis');
                const redis = createClient({ url: process.env.REDIS_URL });
                redis.on('error', () => {}); // Suppress error logs
                await redis.connect();
                const redisShopId = await redis.get('mindcubby:shop_id');
                if (redisShopId) {
                    shopId = redisShopId;
                    console.log('[Cron] ✅ Using shop_id from Redis:', shopId);
                }
                await redis.quit();
            } catch (err) {
                console.warn('[Cron] Could not read from Redis, using env var fallback');
                // Continue - shopId from env var is fine
            }
        }

        if (!shopId) {
            console.error('[Cron] No shop_id available');
            throw new Error('ETSY_SHOP_ID not configured');
        }

        // Validate API credentials
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('[Cron] Missing ETSY_API_KEY or ETSY_API_SECRET');
            throw new Error('Missing Etsy API credentials');
        }

        const xApiKey = `${apiKey}:${apiSecret}`;

        // Use PUBLIC API endpoint - no auth token needed, just x-api-key header
        // This is more resilient than trying to exchange refresh tokens
        const endpoint = `https://api.etsy.com/v3/public/shops/${shopId}/listings?includes=images`;
        
        console.log('[Cron] Fetching from public Etsy API (no auth token needed)');
        console.log('[Cron] Endpoint: /v3/public/shops/{shopId}/listings');

        const listingsResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'x-api-key': xApiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        if (!listingsResponse.ok) {
            const error = await listingsResponse.text();
            console.error('[Cron] HTTP', listingsResponse.status, ':', error);
            throw new Error(`Etsy API returned ${listingsResponse.status}`);
        }

        const listingsData = await listingsResponse.json();

        if (listingsData.results && listingsData.results.length > 0) {
            await setCachedProducts(listingsData.results);
            console.log('[Cron] ✅ Successfully cached', listingsData.results.length, 'products');

            return res.status(200).json({
                success: true,
                message: 'Cache refreshed successfully',
                product_count: listingsData.results.length,
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('[Cron] No products found (shop may have no active listings)');
            
            // Only send alert if genuinely problematic
            // No products might be intentional (shop closed, items paused, etc.)
            
            return res.status(200).json({
                success: false,
                message: 'No products found for this shop',
                product_count: 0
            });
        }

    } catch (error) {
        console.error('[Cron] Error:', error.message);
        
        // Send alert email on cron failure
        try {
            await sendAlert({
                subject: '❌ MindCubby Etsy Cache Refresh Failed',
                errors: [
                    `Cron job failed at ${new Date().toISOString()}`,
                    `Error: ${error.message}`,
                    'Please verify in Vercel:',
                    '  - ETSY_API_KEY is set',
                    '  - ETSY_API_SECRET is set',
                    '  - ETSY_SHOP_ID is set (62670465)'
                ],
                checks: {
                    cache_exists: false,
                    cache_not_expired: false,
                    shop_id_stored: false,
                    product_count: 0,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (alertErr) {
            console.error('[Cron] Failed to send alert:', alertErr.message);
        }
        
        return res.status(500).json({
            error: 'Cache refresh failed',
            message: error.message
        });
    }
}
