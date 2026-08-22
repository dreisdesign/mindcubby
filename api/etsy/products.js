/**
 * Etsy API - Fetch Products
 * GET /api/etsy/products
 * Returns a list of products from your Etsy shop
 * 
 * Requires OAuth access token (stored in HttpOnly cookie from /api/auth/etsy flow)
 * Cookie is automatically sent with fetch(credentials: 'include')
 */

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get access token from HttpOnly cookie
        const accessToken = req.cookies.etsy_token;
        console.log('[Products] Step 1: Checking auth token...');

        if (!accessToken) {
            console.error('[Products] No access token found in cookies');
            return res.status(401).json({
                error: 'Not authenticated',
                message: 'Please authorize with Etsy first via /api/auth/etsy',
                authUrl: '/api/auth/etsy',
            });
        }
        console.log('[Products] ✅ Token found');

        // First, get the authenticated user's shops
        console.log('[Products] Step 2: Fetching user shops from /v3/application/me/shops...');
        const meResponse = await fetch('https://api.etsy.com/v3/application/me/shops', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!meResponse.ok) {
            const errorText = await meResponse.text();
            console.error('[Products] ❌ Shop fetch failed:', meResponse.status, errorText);
            return res.status(meResponse.status).json({
                error: 'Failed to fetch user shops',
                status: meResponse.status,
                details: errorText,
                endpoint: 'https://api.etsy.com/v3/application/me/shops',
            });
        }

        const meData = await meResponse.json();
        console.log('[Products] ✅ Got shop data:', JSON.stringify(meData));

        if (!meData.results || meData.results.length === 0) {
            console.error('[Products] ❌ No shops in results array');
            return res.status(500).json({
                error: 'No shops found for authenticated user',
                details: 'The OAuth token is valid but no shops are associated',
                receivedData: meData,
            });
        }

        const shop = meData.results[0];
        const shopId = shop.shop_id;
        console.log('[Products] ✅ Shop ID extracted:', shopId, 'Full shop:', JSON.stringify(shop));

        if (!shopId) {
            console.error('[Products] ❌ Shop object missing shop_id:', JSON.stringify(shop));
            return res.status(500).json({
                error: 'Could not determine shop ID',
                details: 'Shop object missing shop_id field',
                receivedShop: shop,
            });
        }

        // Now fetch products using the authenticated shop ID
        const etsyUrl = `https://api.etsy.com/v3/application/shops/${shopId}/listings`;
        console.log('[Products] Step 3: Fetching products from', etsyUrl);

        const response = await fetch(etsyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Products] ❌ Products fetch failed:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                message: errorText,
                endpoint: etsyUrl,
            });
        }

        const data = await response.json();
        console.log('[Products] ✅ Got products data:', JSON.stringify(data));

        // Return the products
        return res.status(200).json({
            success: true,
            count: data.results?.length || 0,
            products: data.results || [],
            _raw: data, // Include raw response for debugging
        });

    } catch (error) {
        console.error('[Products] 💥 Catch block error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack,
        });
    }
}
