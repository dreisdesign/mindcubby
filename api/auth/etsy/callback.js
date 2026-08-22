/**
 * Etsy OAuth - Callback Handler
 * GET /api/auth/etsy/callback
 * Handles OAuth code from Etsy, exchanges for access token
 */

export default async function handler(req, res) {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        const clientId = process.env.ETSY_API_KEY;
        const clientSecret = process.env.ETSY_API_SECRET;
        const redirectUri = process.env.ETSY_REDIRECT_URI || 'https://mindcubby.vercel.app/api/auth/etsy/callback';

        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: 'Missing Etsy credentials' });
        }

        // Exchange auth code for access token
        const tokenResponse = await fetch('https://api.etsy.com/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            return res.status(tokenResponse.status).json({
                error: 'Token exchange failed',
                details: error,
            });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.status(500).json({ error: 'No access token in response' });
        }

        // Store token in a secure way
        // For now, we'll set it as an environment variable via a helper endpoint
        // In production, this should be stored in a database or Vercel KV
        
        // Return token to user (they can store in localStorage or we can use a session)
        return res.status(200).json({
            success: true,
            message: 'Authorization successful',
            token: accessToken,
            expiresIn: tokenData.expires_in || 3600,
        });

    } catch (error) {
        console.error('OAuth callback error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
