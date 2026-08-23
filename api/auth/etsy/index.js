/**
 * Etsy OAuth - Redirect to Authorization
 * GET /api/auth/etsy
 * Redirects user to Etsy OAuth authorization page with PKCE
 */

// Generate random string for PKCE
function generateRandomString(length = 43) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = hashArray.map(b => String.fromCharCode(b)).join('');
    return btoa(hashString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export default async function handler(req, res) {
    const clientId = process.env.ETSY_API_KEY;
    // ALWAYS use production domain - must match Etsy app OAuth settings exactly
    const redirectUri = 'https://mindcubby.vercel.app/api/auth/etsy/callback';
    const scope = 'listings_r shops_r'; // Read access to listings and shops
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(128);
    
    console.log('[OAuth] Initiating flow with redirect URI:', redirectUri);

    if (!clientId) {
        return res.status(500).json({ error: 'ETSY_API_KEY not configured' });
    }

    // Generate PKCE code challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = String.fromCharCode.apply(null, hashArray);
    const codeChallenge = btoa(hashString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Store code_verifier and state in HttpOnly cookies (will be retrieved/verified in callback)
    res.setHeader('Set-Cookie', [
        `etsy_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        `etsy_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    ]);

    const authUrl = new URL('https://www.etsy.com/oauth/connect');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.redirect(authUrl.toString());
}
