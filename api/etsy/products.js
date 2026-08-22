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

        // Try multiple host bases (openapi vs api) and include x-api-key if available
        const apiKey = process.env.ETSY_API_KEY;
        const apiSecret = process.env.ETSY_API_SECRET;
        const xApiKeyHeader = apiKey && apiSecret ? `${apiKey}:${apiSecret}` : null;

        const bases = [
            'https://openapi.etsy.com/v3',
            'https://api.etsy.com/v3',
        ];

        // If the OAuth callback previously stored a user id cookie, prefer that (avoid 'me' style endpoints)
        const userIdCookie = req.cookies.etsy_user_id;
        let userData = null;
        let endpointUsed = null;

        if (userIdCookie) {
            const uid = parseInt(userIdCookie, 10);
            console.log('[Products] Found etsy_user_id cookie:', userIdCookie, 'parsed:', uid);
            if (!isNaN(uid)) {
                for (const baseHost of bases) {
                    const shopsUrl = `${baseHost}/application/users/${uid}/shops`;
                    console.log('[Products] Trying user shops via cookie at', shopsUrl);
                    try {
                        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
                        if (xApiKeyHeader) headers['x-api-key'] = xApiKeyHeader;
                        const r = await fetch(shopsUrl, { method: 'GET', headers });
                        const text = await r.text();
                        if (!r.ok) { console.log('[Products] ->', shopsUrl, 'status', r.status, text); continue; }
                        try { userData = JSON.parse(text); } catch (e) { userData = text; }
                        endpointUsed = shopsUrl;
                        console.log('[Products] Success from', shopsUrl, 'data', JSON.stringify(userData));
                        break;
                    } catch (err) {
                        console.error('[Products] Error fetching user shops at', shopsUrl, err);
                        continue;
                    }
                }
            }
        }

        // If no cookie-based discovery worked, fall back to trying host/path combos that don't use 'me'
        if (!userData) {
            const paths = [
                '/application/me',
                '/oauth/me',
            ];
            outer: for (const baseHost of bases) {
                for (const path of paths) {
                    const url = `${baseHost}${path}`;
                    console.log('[Products] Trying', url);
                    try {
                        const headers = {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        };
                        if (xApiKeyHeader) headers['x-api-key'] = xApiKeyHeader;

                        const r = await fetch(url, { method: 'GET', headers });
                        const text = await r.text();
                        if (!r.ok) {
                            console.log('[Products]  ->', url, 'status', r.status, 'body', text);
                            continue;
                        }
                        try { userData = JSON.parse(text); } catch (e) { userData = text; }
                        endpointUsed = url;
                        console.log('[Products] Success from', url, 'data', JSON.stringify(userData));
                        break outer;
                    } catch (err) {
                        console.error('[Products] Fetch error for', url, err);
                        continue;
                    }
                }
            }
        }

        if (!userData) {
            return res.status(502).json({
                error: 'Failed to discover user/shop endpoint',
                details: 'None of the candidate endpoints returned a valid response',
                tried: bases.flatMap(b => paths.map(p => `${b}${p}`)),
            });
        }

        // Try common shapes to extract shop id
        let shopId = null;
        if (userData.shop_id) shopId = userData.shop_id;
        if (!shopId && Array.isArray(userData.shops) && userData.shops.length) shopId = userData.shops[0].shop_id || userData.shops[0].id;
        if (!shopId && Array.isArray(userData.results) && userData.results.length) shopId = userData.results[0].shop_id || userData.results[0].id;

        // If we found a user id but not shops, try /application/users/{id}/shops
        const possibleUserId = userData.user_id || userData.user?.user_id || userData.user?.id || userData.id || userData.member_id;
        if (!shopId && possibleUserId) {
            for (const baseHost of bases) {
                const shopsUrl = `${baseHost}/application/users/${possibleUserId}/shops`;
                console.log('[Products] Trying user shops at', shopsUrl);
                try {
                    const headers = {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    };
                    if (xApiKeyHeader) headers['x-api-key'] = xApiKeyHeader;
                    const shopsResp = await fetch(shopsUrl, { method: 'GET', headers });
                    const shopsText = await shopsResp.text();
                    if (!shopsResp.ok) { console.log('[Products] ->', shopsUrl, shopsResp.status, shopsText); continue; }
                    let shopsData; try { shopsData = JSON.parse(shopsText); } catch (e) { shopsData = shopsText; }
                    console.log('[Products] Got user shops:', JSON.stringify(shopsData));
                    if (shopsData.results && shopsData.results.length) {
                        shopId = shopsData.results[0].shop_id || shopsData.results[0].id;
                        break;
                    }
                    if (Array.isArray(shopsData) && shopsData.length) { shopId = shopsData[0].shop_id || shopsData[0].id; break; }
                } catch (err) {
                    console.error('[Products] Error fetching user shops at', shopsUrl, err);
                    continue;
                }
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
