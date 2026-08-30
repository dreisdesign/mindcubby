/**
 * Debug endpoint - show what's in Redis
 * GET /api/debug/redis
 */

import { createClient } from 'redis';

export default async function handler(req, res) {
    try {
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();

        const shopId = await redis.get('mindcubby:shop_id');
        const cacheKeys = await redis.keys('mindcubby:*');
        const fullCache = await redis.get('mindcubby:shop:products');
        
        const cacheData = fullCache ? JSON.parse(fullCache) : null;

        await redis.quit();

        return res.status(200).json({
            shop_id_from_redis: shopId,
            all_keys: cacheKeys,
            cache_exists: !!fullCache,
            product_count: cacheData?.count || 0,
            cache_timestamp: cacheData?.timestamp,
            first_product: cacheData?.products?.[0]?.listing_id
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}
