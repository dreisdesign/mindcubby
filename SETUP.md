# MindCubby Shop Setup & Configuration

## Quick Start

1. **Visit shop:** https://mindcubby.vercel.app/shop.html
2. **Authorize:** Click "Authorize with Etsy" (first time only)
3. **Done:** Cache updates daily at midnight UTC automatically

## Environment Variables (Vercel)

Add these to your Vercel project settings:

| Variable | Value | Purpose |
|----------|-------|---------|
| `RESEND_API_KEY` | From https://resend.com | Email alerts |
| `ALERT_EMAIL` | alerts@mindcubby.com | Where to send alerts |
| `REFRESH_SECRET` | Random string | Manual cache refresh auth |
| `ETSY_API_KEY` | Your Etsy app ID | API authentication |
| `ETSY_API_SECRET` | Your Etsy secret | API authentication |
| `REDIS_URL` | Upstash URL | Cache storage |

## Available Commands

```bash
# Test system health
npm run test:health

# Test health locally  
npm run test:health:local http://localhost:3000

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

### Private (Requires Auth/Secret)
- `GET /api/auth/etsy` — Start OAuth flow
- `GET /api/auth/etsy/callback` — OAuth callback (automatic)
- `GET /api/etsy/refresh-cache?secret=...` — Manual refresh
- `GET /api/health-check` — System health status

### Cron (Vercel Only)
- `GET /api/etsy/cron-refresh` — Daily 00:00 UTC refresh

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
│   ├── index.js           # OAuth initiator
│   ├── callback.js        # OAuth callback + cache population
│   └── status.js          # Auth status check
├── etsy/
│   ├── cache.js           # Redis cache management
│   ├── products.js        # Protected products endpoint
│   ├── cron-refresh.js    # Daily auto-refresh
│   └── refresh-cache.js   # Manual refresh endpoint
├── health-check.js        # System health monitoring
└── notifications.js       # Email alerts

shop.html                  # Public storefront
refresh-cache.sh          # Manual refresh script
test-health.sh            # Health check test script
```

## Security

- OAuth tokens: HttpOnly, Secure, SameSite cookies (1 hour TTL)
- Manual refresh: Requires `REFRESH_SECRET` header
- Cron: Vercel-only via `x-vercel-cron-secret` header
- All Etsy API calls: Use x-api-key header

## Troubleshooting

**Products not showing?**
- Visit https://mindcubby.vercel.app/shop.html
- Click "Authorize with Etsy"
- Wait ~30 seconds for cache to populate

**Manual refresh failing?**
```bash
# Check REFRESH_SECRET is set
echo $MINDCUBBY_REFRESH_SECRET

# Test health
npm run test:health

# Check logs in Vercel dashboard
```

**Not getting email alerts?**
- Verify `RESEND_API_KEY` in Vercel settings
- Check `ALERT_EMAIL` is correct
- Test with: `npm run test:health`

## Next Steps

- [ ] Add custom domain (update OAuth redirect URI)
- [ ] Add password to admin endpoints
- [ ] Set up Discord webhook alerts
