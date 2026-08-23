/**
 * Etsy API - Cached Products Endpoint
 * GET /api/etsy/cache
 * 
 * Returns cached products from the shop. No authentication required.
 * Cache is updated whenever a user authorizes (see callback.js)
 * 
 * Uses Redis (Upstash via REDIS_URL) for persistent storage across deployments
 */

import { createClient } from 'redis';

const CACHE_KEY = 'mindcubby:shop:products';
const CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

// Create Redis client - automatically reads REDIS_URL from environment
let redis = null;

async function getRedisClient() {
    if (!redis) {
        redis = createClient({
            url: process.env.REDIS_URL
        });
        redis.on('error', (err) => console.error('[Cache] Redis error:', err));
        await redis.connect();
    }
    return redis;
}

export async function getCachedProducts() {
    try {
        const client = await getRedisClient();
        const cacheJson = await client.get(CACHE_KEY);

        if (cacheJson) {
            const cache = JSON.parse(cacheJson);
            console.log('[Cache] ✅ Using cached products from Redis:', cache.count, 'items');
            return cache;
        }
    } catch (err) {
        console.error('[Cache] Error reading from Redis:', err.message);
        // Continue gracefully if Redis is unavailable
    }
    return null;
}

export async function setCachedProducts(products) {
    try {
        const client = await getRedisClient();
        const cache = {
            timestamp: Date.now(),
            count: products.length,
            products: products
        };

        // Store in Redis with TTL
        await client.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(cache));
        console.log('[Cache] ✅ Cached', products.length, 'products in Redis (TTL:', CACHE_TTL, 's)');
    } catch (err) {
        console.error('[Cache] Error writing to Redis:', err.message);
        // Don't fail the OAuth flow if caching fails
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cache = await getCachedProducts();

        if (!cache) {
            console.log('[Cache] No cache found - user needs to authorize first');
            return res.status(200).json({
                success: false,
                cached: false,
                error: 'Cache not available',
                message: 'Products cache is empty. Please authorize at /api/auth/etsy first.',
                products: []
            });
        }

        // Parse cache if it's a string (from KV)
        const cacheData = typeof cache === 'string' ? JSON.parse(cache) : cache;

        return res.status(200).json({
            success: true,
            cached: true,
            cached_at: new Date(cacheData.timestamp).toISOString(),
            count: cacheData.count,
            products: cacheData.products
        });

    } catch (err) {
        console.error('[Cache] Unexpected error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
