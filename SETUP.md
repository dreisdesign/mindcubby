# MindCubby Shop Setup & Configuration

## Quick Start

1. **Visit shop:** https://shop.mindcubby.com/shop.html
2. **Authorize:** Run `./authorize-oauth.sh your_auth_secret` (first time only)
3. **Done:** Cache updates daily at midnight UTC automatically

## Environment Variables (Vercel)

Add these to your Vercel project settings:

| Variable | Value | Purpose |
|----------|-------|---------|
| `ETSY_API_KEY` | Your Etsy app ID | API authentication |
| `ETSY_API_SECRET` | Your Etsy secret | API authentication |
| `REDIS_URL` | Upstash connection string | Cache storage |
| `AUTH_SECRET` | Random hex (openssl rand -hex 16) | OAuth endpoint protection |
| `REFRESH_SECRET` | Random hex (openssl rand -hex 16) | Manual cache refresh auth |
| `RESEND_API_KEY` | From https://resend.com | Email alerts |
| `ALERT_EMAIL` | alerts@mindcubby.com | Where to send alerts |

## Available Commands

```bash
# Initiate secure OAuth (requires AUTH_SECRET)
./authorize-oauth.sh your_auth_secret

# Test system health
npm run test:health

# Test health locally  
npm run test:health:local

# Manually refresh cache (requires REFRESH_SECRET set locally)
export MINDCUBBY_REFRESH_SECRET="your_secret"
npm run refresh:cache
```

## How It Works

### First Time (Authorization)
1. You visit `/shop.html`
2. Click "Authorize with Etsy"
3. Sign into Etsy and approve access
4. System stores your shop_id + fetches products
5. Products cached for 24 hours

### Daily (Automatic)
- **00:00 UTC**: Vercel Cron job runs
- Fetches your latest products
- Updates cache
- Runs health check
- On failure: Email alert sent

### Manual Refresh (Optional)
- Run script anytime to refresh immediately:
  ```bash
  export MINDCUBBY_REFRESH_SECRET="your_secret"
  ./refresh-cache.sh
  ```

## API Endpoints

### Public (No Auth)
- `GET /shop.html` — Product storefront
- `GET /api/etsy/cache` — Get cached products (JSON)

### Private (Requires Secret Header)
- `POST /api/auth/etsy` — Start OAuth flow (X-Auth-Token: AUTH_SECRET)
- `GET /api/auth/etsy?auth_token=...` — Start OAuth flow (fallback, less secure)
- `GET /api/auth/etsy/callback` — OAuth callback (automatic)
- `GET /api/etsy/refresh-cache` — Manual refresh (REFRESH_SECRET header or query param)
- `GET /api/health-check` — System health status

### Cron (Vercel Only)
- `GET /api/etsy/cron-refresh` — Daily 00:00 UTC refresh (x-vercel-cron-secret header)

## Monitoring

### Check System Health
```bash
npm run test:health
```

Returns:
```json
{
  "healthy": true,
  "cache_exists": true,
  "cache_not_expired": true,
  "shop_id_stored": true,
  "product_count": 17,
  "errors": [],
  "timestamp": "2026-08-23T00:00:00.000Z"
}
```

### Email Alerts
System automatically sends failure alerts to `ALERT_EMAIL` when:
- Cache expires
- Cron refresh fails
- Product count drops to 0
- Health check fails

## File Structure

```
api/
├── auth/etsy/
│   ├── index.js           # OAuth initiator (AUTH_SECRET protected)
│   ├── callback.js        # OAuth callback + cache population
│   └── status.js          # Auth status check
├── etsy/
│   ├── cache.js           # Redis cache management
│   ├── products.js        # Protected products endpoint
│   ├── cron-refresh.js    # Daily auto-refresh (Vercel Cron)
│   └── refresh-cache.js   # Manual refresh endpoint
├── health-check.js        # System health monitoring
└── notifications.js       # Email alerts via Resend

shop.html                  # Public product storefront
authorize-oauth.sh         # Secure OAuth initiation script
refresh-cache.sh          # Manual cache refresh script
test-health.sh            # Health check test script
package.json              # Dependencies + npm scripts
SETUP.md                  # This file
```

## Security

### OAuth Endpoint Protection
- **AUTH_SECRET:** Backend token validation (required for `/api/auth/etsy`)
- **Method:** POST with `X-Auth-Token` header (secure, hidden from URL)
- **Fallback:** GET with `?auth_token=` query param (less secure, for convenience)
- **Returns:** 401 Unauthorized if token is missing or invalid

### Token Security
- OAuth tokens: HttpOnly, Secure, SameSite=Lax cookies (1 hour TTL)
- PKCE flow: code_verifier stored in HttpOnly cookie (600 sec TTL)
- CSRF protection: state parameter validated between request/callback

### API Secrets
- REFRESH_SECRET: Required for manual cache refresh endpoint
- Cron refresh: Vercel-only via `x-vercel-cron-secret` header
- All Etsy API calls: Use `x-api-key: {KEY}:{SECRET}` header (colon-separated)

### Redis/Caching
- Cache accessible via public `/api/etsy/cache` endpoint (read-only, no auth)
- Encrypted via HTTPS in transit (Vercel + Upstash)
- Cache TTL: 24 hours (automatic expiration)

### Secrets Management
- **Never commit secrets to git** — all stored in Vercel env vars only
- Use password manager for AUTH_SECRET & REFRESH_SECRET
- Rotate secrets monthly (delete old, generate new with `openssl rand -hex 16`)
- Sensitive headers passed via POST body (not URL)

## Best Practices

1. **OAuth:** Always use secure POST with `X-Auth-Token` header
2. **Secrets:** Store in password manager, not in code/notes
3. **Monitoring:** Check `npm run test:health` weekly
4. **Alerts:** Verify `ALERT_EMAIL` receives notifications
5. **Logging:** Check Vercel dashboard for errors (not terminal)
6. **Updates:** Re-authorize if you change shop products (forces cache refresh)

## Troubleshooting

**Products not showing?**
- Visit https://shop.mindcubby.com/shop.html
- If empty, run: `./authorize-oauth.sh your_auth_secret`
- Wait ~30 seconds for cache to populate

**OAuth showing 401 Unauthorized?**
```bash
# Verify AUTH_SECRET is correct
./authorize-oauth.sh wrong_secret  # → 401 ✓
./authorize-oauth.sh correct_secret  # → Redirects to Etsy ✓
```

**Manual refresh failing?**
```bash
# Check REFRESH_SECRET is set
echo $MINDCUBBY_REFRESH_SECRET

# Test with verbose output
curl -v -H "X-Refresh-Secret: $MINDCUBBY_REFRESH_SECRET" \
  https://shop.mindcubby.com/api/etsy/refresh-cache

# Check system health
npm run test:health
```

**Not getting email alerts?**
- Verify `RESEND_API_KEY` in Vercel settings
- Check `ALERT_EMAIL` is correct and can receive emails
- Test with: `npm run test:health` (should trigger email if "healthy":false)

**Custom domain issues?**
- Verify DNS is propagated: `dig shop.mindcubby.com`
- Check SSL certificate: `openssl s_client -connect shop.mindcubby.com:443`
- Verify Etsy OAuth callback URI matches: `https://shop.mindcubby.com/api/auth/etsy/callback`
