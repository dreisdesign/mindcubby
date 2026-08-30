/**
 * Etsy OAuth - Callback Handler
 * GET /api/auth/etsy/callback
 * Handles OAuth code from Etsy, exchanges for access token with PKCE
 * Also fetches and caches shop products for public browsing
 */

import { setCachedProducts } from '../../etsy/cache.js';

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
        // ALWAYS use production domain - must match Etsy app OAuth settings exactly
        const redirectUri = 'https://mindcubby.com/api/auth/etsy/callback';

        console.log('[Callback] OAuth redirect URI:', redirectUri);

        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: 'Missing Etsy credentials' });
        }

        // Get code_verifier, state, and return_to from cookie for PKCE / CSRF verification
        const cookies = req.headers.cookie || '';
        const codeVerifierMatch = cookies.match(/etsy_code_verifier=([^;]+)/);
        const codeVerifier = codeVerifierMatch ? codeVerifierMatch[1] : null;
        const stateMatch = cookies.match(/etsy_oauth_state=([^;]+)/);
        const stateCookie = stateMatch ? stateMatch[1] : null;
        const returnToMatch = cookies.match(/etsy_return_to=([^;]+)/);
        const returnTo = returnToMatch ? decodeURIComponent(returnToMatch[1]) : '/';  // Home by default

        if (!codeVerifier) {
            return res.status(400).json({ error: 'Missing code verifier - session may have expired' });
        }

        // Validate state to mitigate CSRF
        if (!stateCookie || stateCookie !== state) {
            console.error('Invalid or missing OAuth state. Expected:', stateCookie, 'Got:', state);
            return res.status(400).json({ error: 'Invalid OAuth state' });
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
        // Avoid logging sensitive token values; log only keys for debugging
        try { console.log('OAuth token response keys:', Object.keys(tokenData || {}).join(',')); } catch (e) { }
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        if (!accessToken) {
            return res.status(500).json({ error: 'No access token in response' });
        }

        // Store refresh token in Redis for cron jobs to use
        if (refreshToken) {
            try {
                const { createClient } = await import('redis');
                const redis = createClient({ url: process.env.REDIS_URL });
                await redis.connect();
                await redis.set('mindcubby:etsy_refresh_token', refreshToken);
                await redis.quit();
                console.log('[Callback] ✅ Stored refresh token in Redis for cron refresh');
            } catch (err) {
                console.error('[Callback] Failed to store refresh token:', err.message);
            }
        }

        // Extract user_id from the access token prefix (format: "12345678.token...")
        // According to Etsy docs, the access_token includes a numeric user_id prefix
        const tokenParts = accessToken.split('.');
        const userIdFromToken = tokenParts[0] ? parseInt(tokenParts[0], 10) : null;

        console.log('Extracted user_id from token prefix:', userIdFromToken);

        // Prepare cookies: clear code_verifier, state, and return_to, set token and user id
        const setCookies = [
            `etsy_code_verifier=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;`,
            `etsy_oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;`,
            `etsy_return_to=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;`,
            `etsy_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
        ];

        // Store the user_id extracted from the token
        if (userIdFromToken && !isNaN(userIdFromToken)) {
            setCookies.push(`etsy_user_id=${userIdFromToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
        }
        res.setHeader('Set-Cookie', setCookies);

        // Fetch and cache shop products for public access
        try {
            console.log('[Callback] Fetching shop products for cache...');
            const apiKey = process.env.ETSY_API_KEY;
            const apiSecret = process.env.ETSY_API_SECRET;
            const xApiKey = `${apiKey}:${apiSecret}`;

            // Get shop_id
            const meResponse = await fetch('https://api.etsy.com/v3/application/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-key': xApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (meResponse.ok) {
                const meData = await meResponse.json();
                const shopId = meData.shop_id;

                if (shopId) {
                    // Store shop_id in Redis for Cron refreshes
                    try {
                        const { createClient } = await import('redis');
                        const redis = createClient({ url: process.env.REDIS_URL });
                        await redis.connect();
                        await redis.set('mindcubby:shop_id', shopId.toString());
                        await redis.quit();
                        console.log('[Callback] ✅ Stored shop_id in Redis:', shopId);
                    } catch (err) {
                        console.error('[Callback] Failed to store shop_id:', err.message);
                        // Continue anyway - cron might not work but OAuth succeeded
                    }

                    // Get listings
                    const listingsResponse = await fetch(
                        `https://api.etsy.com/v3/application/shops/${shopId}/listings?includes=images`,
                        {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'x-api-key': xApiKey,
                                'Content-Type': 'application/json',
                            }
                        }
                    );

                    if (listingsResponse.ok) {
                        const listingsData = await listingsResponse.json();
                        if (listingsData.results && listingsData.results.length > 0) {
                            await setCachedProducts(listingsData.results);
                            console.log('[Callback] ✅ Cached', listingsData.results.length, 'products');
                        }
                    } else {
                        console.error('[Callback] Failed to fetch listings for cache');
                    }
                }
            } else {
                console.error('[Callback] Failed to get shop info for cache');
            }
        } catch (cacheErr) {
            console.error('[Callback] Cache update failed (non-fatal):', cacheErr.message);
            // Don't fail the OAuth flow if caching fails
        }

        // Redirect to appropriate page (shop or admin) after successful auth and caching
        return res.redirect(returnTo);

    } catch (error) {
        console.error('OAuth callback error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
