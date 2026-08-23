/**
 * Debug endpoint to check cache status
 * GET /api/debug/cache-status
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const CACHE_KEY = 'mindcubby:shop:products';
        const cache = await kv.get(CACHE_KEY);

        if (!cache) {
            return res.status(200).json({
                status: 'no_cache',
                message: 'No products cached in KV',
                cache_key: CACHE_KEY
            });
        }

        const cacheData = typeof cache === 'string' ? JSON.parse(cache) : cache;

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
