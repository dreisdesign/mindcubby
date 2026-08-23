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
import { checkRateLimit } from '../middleware/rate-limit.js';
import { logRequest, logError } from '../middleware/logger.js';

const CACHE_KEY = 'mindcubby:shop:products';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds (daily refresh)

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
    const startTime = Date.now();

    if (req.method !== 'GET') {
        logRequest(req, res, { status: 405, endpoint: '/api/etsy/cache' });
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limit: 100 requests per IP per 15 minutes
    if (!checkRateLimit(req, { maxRequests: 100, windowMs: 15 * 60 * 1000 })) {
        const duration = Date.now() - startTime;
        logRequest(req, res, { status: 429, endpoint: '/api/etsy/cache', duration });
        return res.status(429).json({ error: 'Too many requests - rate limited' });
    }

    try {
        const cache = await getCachedProducts();

        if (!cache) {
            const duration = Date.now() - startTime;
            logRequest(req, res, {
                status: 200,
                endpoint: '/api/etsy/cache',
                cached: false,
                duration
            });
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

        const duration = Date.now() - startTime;
        logRequest(req, res, {
            status: 200,
            endpoint: '/api/etsy/cache',
            cached: true,
            productCount: cacheData.count,
            duration
        });

        return res.status(200).json({
            success: true,
            cached: true,
            cached_at: new Date(cacheData.timestamp).toISOString(),
            count: cacheData.count,
            products: cacheData.products
        });

    } catch (err) {
        const duration = Date.now() - startTime;
        logError(req, 'Cache endpoint error', { error: err, endpoint: '/api/etsy/cache', duration });
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
