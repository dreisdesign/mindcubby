# Etsy OAuth Flow — MindCubby

**Status: ✅ WORKING** — Backend-only OAuth with automatic browser opening. No UI page required.

This document describes the streamlined OAuth PKCE flow implemented to authorize Etsy access and populate the product cache.

---

## Quick Start

Authorize with Etsy and populate cache (one command):

```bash
./authorize-oauth.sh your_auth_secret
```

The script:
1. Opens browser to `/api/auth/etsy` endpoint
2. Endpoint generates PKCE codes, sets cookies, redirects to Etsy login
3. You approve access on Etsy
4. Redirects back to home with products cached
5. Done — no additional pages needed

---

## How It Works

### OAuth Flow Architecture

```
Browser: open /api/auth/etsy
   ↓
Server: Generate PKCE (code_verifier, code_challenge)
Server: Set cookies (etsy_code_verifier, etsy_oauth_state, etsy_return_to)
Server: Redirect to Etsy OAuth authorization page
   ↓
Browser: User logs in + approves access on Etsy
   ↓
Etsy: Redirects to /api/auth/etsy/callback?code=...&state=...
   ↓
Server: Validate state (CSRF protection)
Server: Read code_verifier from cookie
Server: Exchange code for access token (with PKCE code_verifier)
Server: Fetch and cache shop products
Server: Set etsy_token cookie (HttpOnly, Secure, SameSite=Lax)
Server: Clear temporary cookies
Server: Redirect to home (/)
   ↓
Browser: Home page loads with products displayed
```

### Key Security Features

- **PKCE (RFC 7636):** Code verifier/challenge prevents authorization code interception
- **State Validation:** Prevents CSRF attacks (state generated server-side, validated on callback)
- **HttpOnly Cookies:** Token never exposed to JavaScript
- **Rate Limiting:** 20 OAuth initiations per IP per 15 minutes
- **Server-to-Server Token Exchange:** Token never passes through browser

---

## Endpoints

### `GET /api/auth/etsy`
Initiates OAuth flow with PKCE.

**What it does:**
- Generates random code_verifier (128 chars) and code_challenge
- Generates random state for CSRF validation
- Sets HttpOnly cookies: `etsy_code_verifier`, `etsy_oauth_state`, `etsy_return_to`
- Redirects to: `https://www.etsy.com/oauth/connect?client_id=...&redirect_uri=...&code_challenge=...&state=...`

**Rate limit:** 20 per IP per 15 minutes

---

### `GET /api/auth/etsy/callback`
Handles redirect from Etsy OAuth.

**Query parameters:**
- `code` — Authorization code from Etsy
- `state` — State value (must match cookie)
- `error` — Error reason (if user denies)

**What it does:**
1. Validates state matches cookie (CSRF protection)
2. Extracts code_verifier from cookie
3. POSTs to Etsy token endpoint with PKCE code_verifier
4. Gets access token (format: `user_id.token_string`)
5. Fetches shop products via `/api/etsy/cache` endpoint
6. Sets `etsy_token` cookie (HttpOnly)
7. Clears temporary cookies
8. Redirects to return_to URL (default: `/`)

---

### `GET /api/etsy/cache`
Public endpoint serving cached Etsy products.

**Returns:**
```json
{
  "success": true,
  "cached": true,
  "count": 17,
  "products": [
    {
      "listing_id": 1234567890,
      "title": "Product Name",
      "price": { "amount": 2500, "currency_code": "USD" },
      "images": [{ "url_170x135": "https://..." }]
    }
  ],
  "updatedAt": 1692950446000
}
```

**If cache is empty:**
```json
{
  "success": false,
  "cached": false,
  "error": "Cache not available",
  "message": "Products cache is empty. Please authorize at /api/auth/etsy first.",
  "products": []
}
```

---

## Automated Daily Refresh

**Cron job:** Runs daily at 00:00 UTC (configured in `vercel.json`)

**What it does:**
- Calls `/api/etsy/cron-refresh` via Vercel Cron
- Uses hardcoded shop_id (`ETSY_SHOP_ID` env var)
- Fetches latest listings from Etsy public API
- Updates Redis cache with 24-hour TTL
- Logs success/failure

**File:** `api/etsy/cron-refresh.js`

---

## Manual Cache Refresh

**Endpoint:** `GET /api/etsy/refresh-cache?secret=<REFRESH_SECRET>`

**Security:** Requires `REFRESH_SECRET` env var (set on Vercel, not committed)

**Use case:** Immediately refresh cache without waiting for daily cron

**Example:**
```bash
curl "https://mindcubby.com/api/etsy/refresh-cache?secret=your_refresh_secret"
```

---

## Environment Variables (Vercel)

**Required:**
- `ETSY_API_KEY` — Etsy app Client ID (nd56utbs9vzh79rgv57umwvy)
- `ETSY_API_SECRET` — Etsy app Client Secret (masked on Vercel)
- `ETSY_SHOP_ID` — Your shop ID (62670465)
- `REDIS_URL` — Upstash Redis connection string
- `AUTH_SECRET` — Used by authorize-oauth.sh (not required by API)
- `REFRESH_SECRET` — Manual cache refresh auth

---

## Authorization Script

**File:** `authorize-oauth.sh`

**Usage:**
```bash
./authorize-oauth.sh your_auth_secret
```

**What it does:**
1. Takes AUTH_SECRET as first argument (not required by API, just for documentation)
2. Opens `https://mindcubby.com/api/auth/etsy` in default browser
3. Browser hits endpoint, sets cookies, redirects to Etsy
4. User approves
5. Redirects back to home with products cached

**Supported platforms:**
- macOS (uses `open`)
- Linux (uses `xdg-open`)
- Windows WSL (uses `wsl-open`)
- Fallback: prints URL for manual opening

---

## Troubleshooting

### "Application not recognized" from Etsy

**Cause:** Etsy app redirect URI doesn't match request

**Fix:**
1. Go to https://www.etsy.com/developers/
2. Click your app → Authentication
3. Verify Redirect URI is exactly: `https://mindcubby.com/api/auth/etsy/callback`
4. If changed, save and wait 2-3 minutes for Etsy to process
5. Try again

### "Missing code verifier - session may have expired"

**Cause:** Browser cookies lost between requests

**Fix:**
- Make sure browser doesn't block third-party cookies
- Try clearing browser cache
- Try in a private/incognito window
- Make sure endpoint is https (not http)

### Products not appearing on home page

**Cause:** Cache is empty

**Fix:**
1. Run `./authorize-oauth.sh your_auth_secret`
2. Wait 5 seconds
3. Refresh mindcubby.com
4. Products should appear

---

## Architecture Notes

### Why No Front-End Authorization?

We moved OAuth to backend-only because:
- ✅ Token never exposed to JavaScript
- ✅ PKCE codes generated server-side (more secure)
- ✅ Callback validation happens server-side
- ✅ No front-end libraries needed
- ✅ Works with serverless (Vercel)

### Cache Strategy

- **TTL:** 24 hours (Redis)
- **Size:** ~17 products (~200KB)
- **Refresh:** Daily cron + manual endpoint
- **Fallback:** Returns empty array if cache expired (products unavailable message)

### Cookie Strategy

| Cookie | Type | Scope | TTL | Purpose |
|--------|------|-------|-----|---------|
| `etsy_code_verifier` | HttpOnly | Secure, SameSite=Lax | Session | PKCE code for token exchange |
| `etsy_oauth_state` | HttpOnly | Secure, SameSite=Lax | Session | CSRF validation |
| `etsy_return_to` | HttpOnly | Secure, SameSite=Lax | Session | Redirect URL after auth |
| `etsy_token` | HttpOnly | Secure, SameSite=Lax | Until re-auth | Access token (persistent) |

---

## Related Files

- `api/auth/etsy/index.js` — OAuth initiator
- `api/auth/etsy/callback.js` — Token exchange + cache population
- `api/auth/etsy/status.js` — Simple auth status check
- `api/etsy/cache.js` — Redis cache endpoint
- `api/etsy/cron-refresh.js` — Daily auto-refresh
- `api/etsy/refresh-cache.js` — Manual refresh endpoint
- `authorize-oauth.sh` — CLI authorization script
- `vercel.json` — Cron schedule configuration
