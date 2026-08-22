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

        // First, attempt to discover an endpoint that returns shop info for the authenticated token.
        // Etsy's docs vary; try several likely endpoints and fall back to a users/{id}/shops call.
        const base = 'https://api.etsy.com/v3';
        const candidates = [
            '/application/users/me',
            '/application/users/me/shops',
            '/application/me',
            '/oauth/me',
        ];

        let userData = null;
        let endpointUsed = null;

        for (const path of candidates) {
            const url = `${base}${path}`;
            console.log('[Products] Trying endpoint:', url);
            try {
                const r = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                const text = await r.text();
                if (!r.ok) {
                    console.log('[Products] Endpoint', url, 'returned', r.status, text);
                    continue;
                }
                // parse response
                try {
                    userData = JSON.parse(text);
                } catch (parseErr) {
                    userData = text;
                }
                endpointUsed = url;
                console.log('[Products] Success from', url, 'data=', JSON.stringify(userData));
                break;
            } catch (err) {
                console.error('[Products] Fetch error for', path, err);
                continue;
            }
        }

        if (!userData) {
            return res.status(502).json({
                error: 'Failed to discover user/shop endpoint',
                details: 'None of the candidate endpoints returned a valid response',
                tried: candidates.map(p => `${base}${p}`),
            });
        }

        // Try to extract a shop id from the discovered data
        let shopId = null;
        if (userData.shop_id) shopId = userData.shop_id;
        if (!shopId && userData.shops && userData.shops.length) shopId = userData.shops[0].shop_id || userData.shops[0].id;
        if (!shopId && userData.results && userData.results.length) shopId = userData.results[0].shop_id || userData.results[0].id;

        // If we got a user id but no shop list, fetch the user's shops explicitly
        const possibleUserId = userData.user_id || userData.user?.user_id || userData.user?.id || userData.id || userData.member_id;
        if (!shopId && possibleUserId) {
            const shopsUrl = `${base}/application/users/${possibleUserId}/shops`;
            console.log('[Products] Attempting user shops via', shopsUrl);
            const shopsResp = await fetch(shopsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const shopsText = await shopsResp.text();
            if (shopsResp.ok) {
                let shopsData;
                try { shopsData = JSON.parse(shopsText); } catch (e) { shopsData = shopsText; }
                console.log('[Products] Got user shops:', JSON.stringify(shopsData));
                if (shopsData.results && shopsData.results.length) {
                    shopId = shopsData.results[0].shop_id || shopsData.results[0].id;
                } else if (Array.isArray(shopsData) && shopsData.length) {
                    shopId = shopsData[0].shop_id || shopsData[0].id;
                }
            } else {
                console.log('[Products] User shops fetch returned', shopsResp.status, shopsText);
            }
        }

        console.log('[Products] Final resolved shopId:', shopId, 'from endpoint', endpointUsed);

        if (!shopId) {
            console.error('[Products] ❌ Could not determine shop ID, userData=', JSON.stringify(userData));
            return res.status(500).json({
                error: 'Could not determine shop ID from any endpoint',
                received: userData,
                endpoint: endpointUsed,
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
