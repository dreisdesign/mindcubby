/**
 * Etsy API - Cached Products Endpoint
 * GET /api/etsy/cached
 * 
 * Returns cached products from the shop. No authentication required.
 * Cache is updated whenever a user authorizes (see callback.js)
 */

import fs from 'fs';
import path from 'path';

const CACHE_FILE = '/tmp/mindcubby_shop_cache.json';

export async function getCachedProducts() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            const cache = JSON.parse(data);
            
            // Check if cache is fresh (less than 6 hours old)
            const cacheAge = Date.now() - cache.timestamp;
            const sixHours = 6 * 60 * 60 * 1000;
            
            if (cacheAge < sixHours) {
                console.log('[Cache] ✅ Using cached products (age:', Math.round(cacheAge / 60000), 'min)');
                return cache;
            }
        }
    } catch (err) {
        console.error('[Cache] Error reading cache:', err.message);
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
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log('[Cache] ✅ Updated cache with', products.length, 'products');
    } catch (err) {
        console.error('[Cache] Error writing cache:', err.message);
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

        return res.status(200).json({
            success: true,
            cached: true,
            cached_at: new Date(cache.timestamp).toISOString(),
            count: cache.count,
            products: cache.products
        });

    } catch (err) {
        console.error('[Cache] Unexpected error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
