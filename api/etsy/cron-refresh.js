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

        // Use hardcoded shop_id (set during initial OAuth authorization)
        const shopId = process.env.ETSY_SHOP_ID || '62670465';

        if (!shopId) {
            console.error('[Cron] No ETSY_SHOP_ID configured');
            return res.status(500).json({
                success: false,
                message: 'ETSY_SHOP_ID environment variable not configured'
            });
        }

        console.log('[Cron] Using shop_id:', shopId);

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
            console.error('[Cron] Failed to fetch listings:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch listings from Etsy API',
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
                const healthResponse = await fetch('https://shop.mindcubby.com/api/health-check');
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
