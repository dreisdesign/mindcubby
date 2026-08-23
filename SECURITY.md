# MindCubby Security & Best Practices

## Overview

This document details the security model, threat mitigations, and best practices for the MindCubby shop system.

**Current Status:** ✅ Production Ready
- All secrets in Vercel (not in code)
- OAuth endpoint protected with AUTH_SECRET
- PKCE flow for OAuth (prevents authorization code interception)
- HttpOnly, Secure cookies (prevents XSS token theft)
- CSRF protection via state parameter validation
- Custom domain with SSL/TLS

---

## 1. Authentication & Authorization

### OAuth 2.0 with PKCE Flow

**Standard Flow (Secure):**
```
1. User: ./authorize-oauth.sh AUTH_SECRET
2. Frontend: POST /api/auth/etsy (X-Auth-Token header)
3. Backend: Validate AUTH_SECRET, generate PKCE code_verifier + code_challenge
4. Redirect: User to https://etsy.com/oauth/connect?code_challenge=...
5. User: Sign into Etsy, approve scopes (listings_r shops_r)
6. Etsy: Redirects to /api/auth/etsy/callback?code=...&state=...
7. Backend: Exchange code for access token using code_verifier (PKCE)
8. Backend: Fetch shop_id, products, cache for 24h
9. Redirect: User to /etsy/ (publicly viewable)
```

**Why PKCE Matters:**
- Prevents authorization code interception attacks
- code_verifier never transmitted over network
- Even if code is intercepted, attacker can't exchange it without verifier
- Required by modern OAuth apps

**Threat Mitigated:** Authorization code interception, unauthorized token exchange

---

### AUTH_SECRET Validation

**Endpoint:** `POST /api/auth/etsy` (with `X-Auth-Token` header)

**Implementation:**
```javascript
const authSecret = process.env.AUTH_SECRET;
const authTokenFromRequest = req.headers['x-auth-token'];

if (!authTokenFromRequest || authTokenFromRequest !== authSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
}
// ... proceed with OAuth flow
```

**Why Header-Based (not query param):**
- ✅ Hidden from browser history
- ✅ Not logged in server access logs (usually)
- ✅ Not visible in referer headers
- ✅ Not cached in browser/proxy
- ❌ Query params are visible everywhere

**Threat Mitigated:** Public OAuth endpoint abuse, unauthorized re-authorization

---

### Token Storage & Cookies

**HttpOnly Cookies (OAuth Tokens):**
```
Set-Cookie: etsy_token=<access_token>; 
    HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

| Attribute | Purpose | Threat |
|-----------|---------|--------|
| HttpOnly | Prevent JS access (XSS) | XSS token theft |
| Secure | HTTPS only | MITM attacks |
| SameSite=Lax | Prevent cross-site submission | CSRF attacks |
| Max-Age=3600 | 1 hour expiration | Token replay attacks |

**Threat Mitigated:** XSS attacks, CSRF, session hijacking, token replay

**Temporary Cookies (PKCE/State):**
```
Set-Cookie: etsy_code_verifier=...; HttpOnly; Secure; Max-Age=600
Set-Cookie: etsy_oauth_state=...; HttpOnly; Secure; Max-Age=600
```
- Shorter TTL (10 min) — used only during OAuth flow
- Automatically cleared after use
- PKCE verifier never exposed to browser

---

## 2. Secrets Management

### Environment Variables (Vercel)

All secrets stored **only** in Vercel, not in git:

| Secret | Usage | Risk Level |
|--------|-------|-----------|
| `ETSY_API_KEY` | Etsy API client ID | Critical |
| `ETSY_API_SECRET` | Etsy API secret | Critical |
| `REDIS_URL` | Cache database URL | High |
| `AUTH_SECRET` | OAuth endpoint protection | High |
| `REFRESH_SECRET` | Manual refresh endpoint | High |
| `RESEND_API_KEY` | Email service | Medium |
| `ALERT_EMAIL` | Alert recipient (non-sensitive) | Low |

**Best Practices:**
- ✅ Generate with: `openssl rand -hex 16` (random, non-guessable)
- ✅ Store in password manager (not sticky notes, not emails)
- ✅ Rotate monthly or after deployment
- ✅ Use different secrets for different environments (prod vs staging)
- ❌ Never log or print secrets
- ❌ Never commit to git (even accidentally)

**How Vercel Protects Secrets:**
- Secrets stored encrypted at rest
- Only injected at runtime (not in source)
- Not visible in logs or build output
- Rotate by updating value in dashboard → triggers redeploy

---

### Etsy API Credentials

**x-api-key Header Format:**
```
x-api-key: {ETSY_API_KEY}:{ETSY_API_SECRET}
```

**Why Colon-Separated (not space):**
- Etsy v3 API requirement
- Common mistake: using space → 401 errors
- Must match exactly

**Used For:**
- `/v3/public/` endpoints (public shop products)
- `/v3/application/` endpoints (OAuth token exchange, user info)

**Threat Mitigated:** API rate limiting abuse, unauthorized API access

---

## 3. Network Security

### HTTPS / TLS

**Custom Domain:** shop.mindcubby.com
- ✅ SSL certificate (Let's Encrypt)
- ✅ Valid until Nov 21, 2026
- ✅ TLS 1.3 + AEAD-CHACHA20-POLY1305-SHA256
- ✅ All endpoints HTTPS only (no HTTP fallback)

**Threat Mitigated:** Man-in-the-middle (MITM) attacks, eavesdropping

### CORS & Headers

**shop.html** (public):
- No authentication required
- Fetches from `/api/etsy/cache` (public endpoint)
- No sensitive headers exposed

**OAuth endpoints** (protected):
- `X-Auth-Token` header only visible to server
- Cookies sent automatically by browser (HttpOnly)

**Threat Mitigated:** Cross-origin attacks, token leakage via headers

---

## 4. Data Security

### Redis Cache

**What's Cached:**
```json
{
  "timestamp": 1234567890,
  "count": 17,
  "products": [
    {
      "listing_id": 12345,
      "title": "3D Printable Model",
      "price": { "amount": 400, "divisor": 100 },
      "images": [{ "url": "https://..." }]
    }
  ]
}
```

**Security:**
- ✅ Read-only public endpoint (no auth needed)
- ✅ No personal data (just product catalog)
- ✅ HTTPS in transit (Vercel → Upstash)
- ✅ Automatic TTL (24h expiration)
- ❌ Not encrypted at rest (Upstash free tier)

**Risk:** Cache data is semi-public (shop listings are public on Etsy anyway)

**Best Practices:**
- Never cache personal user data (addresses, payment info)
- Verify cache key before using: `mindcubby:shop:products`
- Monitor cache hits/misses in health check

### No Personal Data Stored

**What's NOT cached:**
- ❌ Customer info (emails, addresses)
- ❌ Payment info (credit cards, passwords)
- ❌ Shop settings (rates, shipping)
- ❌ Etsy API tokens (stored in cookies only)

**Threat Mitigated:** Data breach impact (public data only)

---

## 5. API Endpoint Security

### Public Endpoints

| Endpoint | Auth | Purpose | Abuse Risk |
|----------|------|---------|-----------|
| `GET /etsy/` | ✗ | Storefront UI | Low (static HTML) |
| `GET /api/etsy/cache` | ✗ | Product JSON | Low (read-only) |

**Rate Limiting:** None (Vercel free tier doesn't support)
- Recommendation: Add rate limiting before production scale

### Protected Endpoints

| Endpoint | Auth | Purpose | Abuse Risk |
|----------|------|---------|-----------|
| `POST /api/auth/etsy` | AUTH_SECRET | OAuth init | Critical (re-auth hijack) |
| `GET /api/auth/etsy/callback` | state token | OAuth callback | Low (state validates) |
| `GET /api/etsy/refresh-cache` | REFRESH_SECRET | Manual refresh | Medium (cache staleness) |
| `GET /api/health-check` | none | System status | Low (read-only) |

### Cron Endpoint

| Endpoint | Auth | Purpose | Schedule |
|----------|------|---------|----------|
| `GET /api/etsy/cron-refresh` | x-vercel-cron-secret | Daily refresh | 00:00 UTC |

**Vercel Cron Protection:**
- ✅ Only Vercel servers can trigger (verified IP)
- ✅ x-vercel-cron-secret header required
- ✅ Schedule immutable (can't be called manually)

---

## 6. Attack Surface & Mitigations

### Scenario 1: OAuth Endpoint Hijacking

**Attack:** Attacker discovers `/api/auth/etsy` is public, re-authorizes their own shop

**Mitigation:**
- ✅ AUTH_SECRET required (attacker doesn't have it)
- ✅ Stored in Vercel only (not in repo)
- ✅ Using secure POST method (not URL-visible)

**Defense Level:** 🟢 Protected

---

### Scenario 2: Cache Poisoning

**Attack:** Attacker modifies Redis cache to show malicious products

**Risk Level:** 🟡 Possible but unlikely
- Redis URL is secret (Vercel only)
- Upstash has firewall (only Vercel can access)
- Cache is auto-refreshed daily

**Mitigation:**
- ✅ Cache TTL (24h) — limits poisoning duration
- ✅ Health check monitors product count
- ✅ Email alerts on health check failure

**Defense Level:** 🟡 Partially protected (recommend: Redis ACL token)

---

### Scenario 3: Token Theft via XSS

**Attack:** Attacker injects malicious JS into etsy/index.html, steals Etsy token

**Mitigation:**
- ✅ HttpOnly cookies (JS can't read token)
- ✅ SameSite=Lax (prevents cross-site submission)
- ✅ No sensitive data in localStorage

**Defense Level:** 🟢 Protected

**Future Improvement:** Content Security Policy (CSP) headers

---

### Scenario 4: Cache Expiration Attack

**Attack:** Attacker waits 24h, cache expires, shop shows "Authorize" button

**Risk Level:** 🟢 Low
- Cache auto-refreshes at 00:00 UTC daily
- Cron job runs independently
- User can manually refresh anytime

**Mitigation:**
- ✅ Daily cron refresh (00:00 UTC)
- ✅ Health check monitors expiration
- ✅ Email alerts if cron fails

**Defense Level:** 🟢 Protected

---

### Scenario 5: CSRF Attack

**Attack:** Attacker tricks user into clicking link that triggers re-auth

**Mitigation:**
- ✅ State parameter validation (OAuth callback verifies)
- ✅ PKCE code_verifier (authorization code unusable without it)
- ✅ SameSite cookies (prevent cross-site submission)

**Defense Level:** 🟢 Protected

---

## 7. Production Checklist

### Before Going Live ✅

- [x] Custom domain configured (shop.mindcubby.com)
- [x] SSL certificate valid (Let's Encrypt)
- [x] All secrets in Vercel (not in code)
- [x] AUTH_SECRET generated and set
- [x] REFRESH_SECRET generated and set
- [x] Etsy app OAuth redirect URI updated
- [x] OAuth callback tested
- [x] Products loading in cache
- [x] Health check passing
- [x] Email alerts configured
- [x] Daily cron refresh scheduled
- [x] Documentation updated (SETUP.md, SECURITY.md)

### Ongoing Maintenance ✅

- [x] Weekly: `npm run test:health` (verify system healthy)
- [ ] Monthly: Rotate AUTH_SECRET and REFRESH_SECRET
- [ ] Monthly: Review Vercel logs for errors
- [ ] Quarterly: Audit API access patterns
- [ ] Annually: Security review + penetration testing

---

## 8. Known Limitations & Future Improvements

### Current Limitations

1. **No Rate Limiting**
   - Vercel free tier doesn't support middleware
   - Recommendation: Move to paid tier or add external rate limiter

2. **No Redis Authentication**
   - Upstash URL is only auth method
   - Recommendation: Use Upstash ACL token

3. **No API Logging**
   - Can't audit who called what endpoints
   - Recommendation: Add structured logging to Vercel

4. **No Encryption at Rest**
   - Redis cache not encrypted (Upstash free tier)
   - Recommendation: Use Upstash Pro or external encryption

### Recommended Improvements (Priority Order)

1. **HIGH:** Add rate limiting (prevent DDoS on public endpoints)
2. **HIGH:** Enable Redis ACL (stronger auth than URL)
3. **MEDIUM:** Add structured logging (audit trail)
4. **MEDIUM:** Content Security Policy headers (prevent XSS)
5. **LOW:** Encryption at rest (if handling sensitive data)
6. **LOW:** Two-factor authentication (if owner account compromise risk)

---

## 9. Incident Response

### If AUTH_SECRET is Compromised

```bash
# 1. Generate new secret
openssl rand -hex 16

# 2. Update in Vercel (immediate redeploy)
# → Vercel dashboard → Settings → Environment Variables
# → Update AUTH_SECRET value

# 3. Verify deployment
curl -X POST https://shop.mindcubby.com/api/auth/etsy \
  -H "X-Auth-Token: new_secret" \
  # → Should redirect to Etsy (401 with old secret)

# 4. Update password manager
# → Save new value locally
```

**Impact:** Temporary window where unauthorized re-auth is possible
**Fix Time:** < 5 minutes

---

### If REFRESH_SECRET is Compromised

```bash
# Similar to AUTH_SECRET:
# 1. Generate new secret
# 2. Update REFRESH_SECRET in Vercel
# 3. Update password manager
# 4. Verify: npm run refresh:cache (with new secret)
```

**Impact:** Attacker could force cache refreshes (DoS risk)
**Fix Time:** < 5 minutes

---

### If ETSY_API_SECRET is Compromised

```bash
# 1. Immediately revoke API key in Etsy app settings
# 2. Generate new key pair in Etsy dashboard
# 3. Update ETSY_API_KEY + ETSY_API_SECRET in Vercel
# 4. Test OAuth flow with new credentials
# 5. Monitor Etsy API usage for suspicious activity
```

**Impact:** Attacker could impersonate your app, access shop data
**Fix Time:** < 15 minutes
**Recommendation:** Check Etsy API logs for unauthorized access

---

### If Custom Domain is Compromised (DNS)

```bash
# 1. Check DNS records: dig shop.mindcubby.com
# 2. Verify CNAME points to Vercel (cname.vercel.sh)
# 3. If hijacked:
#    - Contact domain registrar
#    - Update DNS to correct value
#    - Clear DNS cache
```

**Impact:** Could redirect traffic to malicious site
**Fix Time:** Depends on registrar (1-24h for DNS propagation)

---

## 10. Security Compliance

### Data Handling

- **Type:** Public product data (same as Etsy marketplace)
- **PII:** None collected
- **GDPR:** Not applicable (no personal data)
- **CCPA:** Not applicable (no personal data)

### Compliance Notes

- Cache is publicly accessible (but only via your API)
- No cookies set on public endpoints
- No user tracking or analytics
- No third-party integrations (except Etsy, Resend, Upstash)

---

## Questions or Concerns?

- Review Etsy API docs: https://developers.etsy.com/
- Vercel security: https://vercel.com/security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OAuth 2.0 PKCE: https://datatracker.ietf.org/doc/html/rfc7636
