/**
 * Etsy API - Cached Products Endpoint
 * GET /api/etsy/cache
 * 
 * Returns cached products from the shop. No authentication required.
 * Cache is updated whenever a user authorizes (see callback.js)
 * 
 * Uses Vercel KV for persistent storage across deployments
 */

import { kv } from '@vercel/kv';

const CACHE_KEY = 'mindcubby:shop:products';
const CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

export async function getCachedProducts() {
    try {
        const cache = await kv.get(CACHE_KEY);
        
        if (cache) {
            console.log('[Cache] ✅ Using cached products from KV:', cache.count, 'items');
            return cache;
        }
    } catch (err) {
        console.error('[Cache] Error reading from KV:', err.message);
        // Continue gracefully if KV is unavailable
    }
    return null;
}

export async function setCachedProducts(products) {
    try {
        const cache = {
            timestamp: Date.now(),
            count: products.length,
            products: products
        };
        
        // Store in Vercel KV with TTL
        await kv.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(cache));
        console.log('[Cache] ✅ Cached', products.length, 'products in KV (TTL:', CACHE_TTL, 's)');
    } catch (err) {
        console.error('[Cache] Error writing to KV:', err.message);
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
