/**
 * Etsy API - Public Products Endpoint
 * GET /api/etsy/public
 * Returns a list of products from a public Etsy shop
 * 
 * NO AUTHENTICATION REQUIRED
 * Attempts to use:
 * 1. Cookie-based numeric shop_id from OAuth (if available)
 * 2. ETSY_SHOP_ID environment variable (numeric ID, not slug)
 */

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Try to get numeric shop_id from cookies first (set during OAuth)
        let shopId = req.cookies.etsy_shop_id;
        
        // Fall back to environment variable
        if (!shopId) {
            shopId = process.env.ETSY_SHOP_ID;
        }

        if (!shopId) {
            console.error('[Public] Missing shop ID');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Shop ID not available. Set ETSY_SHOP_ID (numeric ID) in environment variables or authorize via /api/auth/etsy'
            });
        }
        
        // Ensure shopId is numeric (remove any non-digits)
        const numericShopId = shopId.toString().replace(/\D/g, '');
        if (!numericShopId) {
            console.error('[Public] Invalid shop ID - must be numeric:', shopId);
            return res.status(400).json({
                error: 'Invalid shop ID',
                message: 'Shop ID must be numeric. You provided: ' + shopId
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

        // Fetch listings from the shop using numeric ID
        const listingsUrl = `https://api.etsy.com/v3/public/shops/${numericShopId}/listings?includes=images`;
        console.log('[Public] Fetching listings from shop ID:', numericShopId);
        console.log('[Public] URL:', listingsUrl);

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
            console.error('[Public] Using shop ID:', numericShopId);
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                message: errorText,
                endpoint: listingsUrl,
                shopId: numericShopId,
            });
        }

        const data = await response.json();
        console.log('[Public] ✅ Got', data.count, 'products from shop', numericShopId);

        // Transform response to match shop.html expectations
        return res.status(200).json({
            success: true,
            shop_id: numericShopId,
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
