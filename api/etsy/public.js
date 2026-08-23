/**
 * Etsy API - Public Products Endpoint
 * GET /api/etsy/public
 * Returns a list of products from a public Etsy shop
 * 
 * Uses server-side API credentials (no user auth needed)
 * Fetches using x-api-key only
 */

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get numeric shop_id from cookies or environment
        let shopId = req.cookies.etsy_shop_id || process.env.ETSY_SHOP_ID;

        if (!shopId) {
            console.error('[Public] Missing shop ID');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Shop ID not available. Authorize via /api/auth/etsy or set ETSY_SHOP_ID env var'
            });
        }
        
        // Extract numeric shop ID
        const numericShopId = shopId.toString().replace(/\D/g, '');
        if (!numericShopId) {
            console.error('[Public] Invalid shop ID:', shopId);
            return res.status(400).json({
                error: 'Invalid shop ID',
                message: 'Shop ID must contain numbers. Got: ' + shopId
            });
        }

        // Get API credentials
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('[Public] Missing API credentials');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Etsy API credentials not configured'
            });
        }

        const xApiKey = `${apiKey}:${apiSecret}`;

        // Fetch listings using application endpoint with x-api-key only
        // No Bearer token needed - just API key
        const listingsUrl = `https://api.etsy.com/v3/application/shops/${numericShopId}/listings?includes=images`;
        console.log('[Public] Fetching from:', listingsUrl);

        const response = await fetch(listingsUrl, {
            method: 'GET',
            headers: {
                'x-api-key': xApiKey,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Public] ❌ Failed:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                details: errorText,
            });
        }

        const data = await response.json();
        console.log('[Public] ✅ Got', data.count, 'products');

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
