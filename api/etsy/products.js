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
        const userIdCookie = req.cookies.etsy_user_id;
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

        // REQUIRED: x-api-key header for ALL Etsy API v3 requests
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('[Products] Missing ETSY_API_KEY or ETSY_API_SECRET');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Etsy API credentials not configured'
            });
        }

        const xApiKey = `${apiKey}:${apiSecret}`;

        // Step 2: Get shop_id using the /users/me endpoint
        console.log('[Products] Step 2: Fetching shop_id from /users/me...');

        let shopId = null;
        const meUrl = 'https://api.etsy.com/v3/application/users/me';

        try {
            const meResponse = await fetch(meUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-key': xApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!meResponse.ok) {
                const errorText = await meResponse.text();
                console.error('[Products] /users/me failed:', meResponse.status, errorText);
                return res.status(meResponse.status).json({
                    error: 'Failed to get user info from Etsy',
                    status: meResponse.status,
                    details: errorText,
                    endpoint: meUrl
                });
            }

            const meData = await meResponse.json();
            console.log('[Products] /users/me response:', JSON.stringify(meData));

            shopId = meData.shop_id;

            if (!shopId) {
                console.error('[Products] No shop_id in /users/me response');
                return res.status(500).json({
                    error: 'No shop found for this user',
                    message: 'This Etsy account does not have an active shop',
                    received: meData
                });
            }

            console.log('[Products] ✅ Got shop_id:', shopId);
        } catch (err) {
            console.error('[Products] Error calling /users/me:', err);
            return res.status(500).json({
                error: 'Failed to fetch user info',
                message: err.message
            });
        }



        // Step 3: Fetch listings from the shop
        const listingsUrl = `https://api.etsy.com/v3/application/shops/${shopId}/listings?includes=images`;
        console.log('[Products] Step 3: Fetching listings from', listingsUrl);

        const response = await fetch(listingsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': xApiKey,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Products] ❌ Listings fetch failed:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                message: errorText,
                endpoint: listingsUrl,
            });
        }

        const data = await response.json();
        console.log('[Products] ✅ Got listings data. Count:', data.count || 0);

        // Log first product structure to debug price/image fields
        if (data.results && data.results.length > 0) {
            const first = data.results[0];
            console.log('[Products] First product keys:', Object.keys(first).join(', '));
            console.log('[Products] First product sample:', JSON.stringify({
                listing_id: first.listing_id,
                title: first.title,
                price: first.price,
                price_type: typeof first.price,
                images: first.images ? `${first.images.length} images` : 'none',
                first_image_url: first.images?.[0]?.url_570xN || first.images?.[0]?.url,
            }, null, 2));
        }

        // Return the listings (Etsy calls them listings, not products)
        return res.status(200).json({
            success: true,
            shop_id: shopId,
            count: data.count || 0,
            products: data.results || [],
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
