/**
 * Etsy API - Public Products Endpoint
 * GET /api/etsy/public
 * Returns a list of products from a public Etsy shop
 * 
 * NO AUTHENTICATION REQUIRED
 * Uses shop_id from ETSY_SHOP_ID environment variable
 */

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get shop_id from environment or query parameter
        const shopId = process.env.ETSY_SHOP_ID;

        if (!shopId) {
            console.error('[Public] Missing ETSY_SHOP_ID environment variable');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Shop ID not configured. Set ETSY_SHOP_ID in environment variables.'
            });
        }

        // REQUIRED: x-api-key header for ALL Etsy API v3 requests
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('[Public] Missing ETSY_API_KEY or ETSY_API_SECRET');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Etsy API credentials not configured'
            });
        }

        const xApiKey = `${apiKey}:${apiSecret}`;

        // Fetch listings from the shop (public endpoint - no Bearer token needed)
        const listingsUrl = `https://api.etsy.com/v3/public/shops/${shopId}/listings?includes=images`;
        console.log('[Public] Fetching listings from shop:', shopId);
        console.log('[Public] URL:', listingsUrl);
        console.log('[Public] Using x-api-key:', xApiKey.substring(0, 10) + '...');

        const response = await fetch(listingsUrl, {
            method: 'GET',
            headers: {
                'x-api-key': xApiKey,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Public] ❌ Listings fetch failed:', response.status, errorText);
            console.error('[Public] Full URL:', listingsUrl);
            console.error('[Public] Response:', errorText);
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                message: errorText,
                endpoint: listingsUrl,
                shopId: shopId,
            });
        }

        const data = await response.json();
        console.log('[Public] ✅ Got', data.count, 'products');

        // Transform response to match shop.html expectations
        return res.status(200).json({
            success: true,
            shop_id: shopId,
            count: data.count,
            products: data.results || []
        });

    } catch (err) {
        console.error('[Public] Unexpected error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
