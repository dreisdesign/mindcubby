/**
 * Debug endpoint to check cache status
 * GET /api/debug/cache-status
 */

import { createClient } from 'redis';

export default async function handler(req, res) {
    try {
        const CACHE_KEY = 'mindcubby:shop:products';

        const redis = createClient({
            url: process.env.REDIS_URL
        });
        await redis.connect();

        const cacheJson = await redis.get(CACHE_KEY);
        await redis.quit();

        if (!cacheJson) {
            return res.status(200).json({
                status: 'no_cache',
                message: 'No products cached in Redis',
                cache_key: CACHE_KEY
            });
        }

        const cacheData = JSON.parse(cacheJson);

        return res.status(200).json({
            status: 'cached',
            message: 'Products found in cache',
            cache_key: CACHE_KEY,
            count: cacheData.count,
            timestamp: cacheData.timestamp,
            cached_at: new Date(cacheData.timestamp).toISOString(),
            products_count: cacheData.products ? cacheData.products.length : 0
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message,
            stack: err.stack
        });
    }
}
