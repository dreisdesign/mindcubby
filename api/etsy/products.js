/**
 * Etsy API - Fetch Products
 * GET /api/etsy/products
 * Returns a list of products from your Etsy shop
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ETSY_API_KEY;
    const shopId = process.env.ETSY_SHOP_ID;

    // Validate environment variables
    if (!apiKey || !shopId) {
      return res.status(500).json({
        error: 'Missing environment variables',
        details: 'ETSY_API_KEY and ETSY_SHOP_ID are required',
      });
    }

    // Fetch products from Etsy API v3
    const etsyUrl = `https://openapi.etsy.com/v3/application/shops/${shopId}/listings`;
    
    const response = await fetch(etsyUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
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
