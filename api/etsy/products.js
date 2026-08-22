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

        if (!accessToken) {
            return res.status(401).json({
                error: 'Not authenticated',
                message: 'Please authorize with Etsy first via /api/auth/etsy',
                authUrl: '/api/auth/etsy',
            });
        }

        // First, get the authenticated user's shops
        const meResponse = await fetch('https://api.etsy.com/v3/application/me/shops', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!meResponse.ok) {
            console.error('Me shops response:', await meResponse.text());
            return res.status(meResponse.status).json({
                error: 'Failed to fetch user shops',
                details: await meResponse.text(),
            });
        }

        const meData = await meResponse.json();
        
        if (!meData.results || meData.results.length === 0) {
            return res.status(500).json({
                error: 'No shops found for authenticated user',
                details: 'The OAuth token is valid but no shops are associated',
            });
        }

        const shopId = meData.results[0].shop_id;

        if (!shopId) {
            return res.status(500).json({
                error: 'Could not determine shop ID',
                details: 'Shop object missing shop_id field',
            });
        }

        // Now fetch products using the authenticated shop ID
        const etsyUrl = `https://api.etsy.com/v3/application/shops/${shopId}/listings`;

        const response = await fetch(etsyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Etsy API Error',
                status: response.status,
                message: await response.text(),
            });
        }

        const data = await response.json();

        // Return the products
        return res.status(200).json({
            success: true,
            count: data.results?.length || 0,
            products: data.results || [],
            _raw: data, // Include raw response for debugging
        });

    } catch (error) {
        console.error('Etsy API Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
}
