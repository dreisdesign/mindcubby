/**
 * Etsy OAuth - Callback Handler
 * GET /api/auth/etsy/callback
 * Handles OAuth code from Etsy, exchanges for access token with PKCE
 */

export default async function handler(req, res) {
    const { code, state, error, error_description } = req.query;

    if (error) {
        return res.status(400).json({
            error: error,
            description: error_description || 'OAuth error occurred'
        });
    }

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        const clientId = process.env.ETSY_API_KEY;
        const clientSecret = process.env.ETSY_API_SECRET;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'mindcubby.com';
        const redirectUri = `${protocol}://${host}/api/auth/etsy/callback`;

        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: 'Missing Etsy credentials' });
        }

        // Get code_verifier from cookie
        const cookies = req.headers.cookie || '';
        const codeVerifierMatch = cookies.match(/etsy_code_verifier=([^;]+)/);
        const codeVerifier = codeVerifierMatch ? codeVerifierMatch[1] : null;

        if (!codeVerifier) {
            return res.status(400).json({ error: 'Missing code verifier - session may have expired' });
        }

        // Exchange auth code for access token
        const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
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
                code_verifier: codeVerifier,
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
        console.log('OAuth tokenData:', JSON.stringify(tokenData));
        const accessToken = tokenData.access_token;

        // If the token response includes a user id, store it for later shop lookups
        const possibleUserId = tokenData.user_id || tokenData.user?.id || tokenData.account_id || tokenData.resource_owner?.id || tokenData.owner_id || tokenData.id;
        if (possibleUserId) {
            console.log('Storing user id from token response:', possibleUserId);
            // set HttpOnly cookie for user id (short-lived)
            res.setHeader('Set-Cookie', [
                `etsy_code_verifier=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly;`,
                `etsy_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
                `etsy_user_id=${possibleUserId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
            ]);
        } else {
            // store only token
            res.setHeader('Set-Cookie', [
                `etsy_code_verifier=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly;`,
                `etsy_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
            ]);
        }

        if (!accessToken) {
            return res.status(500).json({ error: 'No access token in response' });
        }

        // Redirect back to connect page (token and optional user id in cookies)
        return res.redirect('/etsy-connect.html');

    } catch (error) {
        console.error('OAuth callback error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
