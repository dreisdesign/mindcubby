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

        // First, get the authenticated user's info
        console.log('[Products] Step 2: Fetching authenticated user from /v3/application/me...');
        const meResponse = await fetch('https://api.etsy.com/v3/application/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!meResponse.ok) {
            const errorText = await meResponse.text();
            console.error('[Products] ❌ User fetch failed:', meResponse.status, errorText);
            return res.status(meResponse.status).json({
                error: 'Failed to fetch authenticated user',
                status: meResponse.status,
                details: errorText,
                endpoint: 'https://api.etsy.com/v3/application/me',
            });
        }

        const meData = await meResponse.json();
        console.log('[Products] ✅ Got user data:', JSON.stringify(meData));

        const shopId = meData.shop_id || meData.shops?.[0]?.shop_id;
        console.log('[Products] ✅ Shop ID extracted:', shopId, 'Full user data:', JSON.stringify(meData));

        if (!shopId) {
            console.error('[Products] ❌ Could not find shop_id in user data:', JSON.stringify(meData));
            return res.status(500).json({
                error: 'Could not determine shop ID from user data',
                details: 'User data missing shop_id field',
                receivedData: meData,
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
