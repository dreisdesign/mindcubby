/**
 * Etsy OAuth - Redirect to Authorization
 * GET /api/auth/etsy
 * Redirects user to Etsy OAuth authorization page
 */

export default async function handler(req, res) {
    const clientId = process.env.ETSY_API_KEY;
    const redirectUri = process.env.ETSY_REDIRECT_URI || 'https://mindcubby.vercel.app/api/auth/etsy/callback';
    const scope = 'listings_r'; // Read-only access to listings
    const state = Math.random().toString(36).substring(7); // Simple state for security

    if (!clientId) {
        return res.status(500).json({ error: 'ETSY_API_KEY not configured' });
    }

    const authUrl = new URL('https://www.etsy.com/oauth/connect');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
}
