/**
 * Etsy API - Cache Status & Refresh Info
 * GET /api/etsy/cache-refresh-needed
 * 
 * Shows if cache needs refresh based on age
 * To refresh: user must re-authorize via /api/auth/etsy
 */

import { getCachedProducts } from './cache.js';

export default async function handler(req, res) {
    try {
        const cache = await getCachedProducts();

        if (!cache) {
            return res.status(200).json({
                cached: false,
                message: 'No cache available - authorize to populate',
                needs_refresh: true
            });
        }

        const now = Date.now();
        const age = (now - cache.timestamp) / 1000 / 60; // minutes
        const ttl = 24 * 60; // 24 hours in minutes
        const expiresIn = ttl - age;
        const needsRefresh = expiresIn < 0;

        return res.status(200).json({
            cached: true,
            product_count: cache.count,
            cached_at: new Date(cache.timestamp).toISOString(),
            age_minutes: Math.round(age),
            expires_in_hours: Math.round(expiresIn / 60),
            needs_refresh: needsRefresh,
            message: needsRefresh 
                ? 'Cache expired - please re-authorize to refresh'
                : `Cache valid for ${Math.round(expiresIn / 60)} more hours`
        });
        
    } catch (err) {
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
