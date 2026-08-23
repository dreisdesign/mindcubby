# MindCubby Monitoring & Deployment Guide

**Deployment Date:** August 23, 2026
**Changes Deployed:** Rate limiting + Structured JSON logging
**Status:** 🟢 LIVE

---

## Daily Monitoring Checklist

### ✅ Health Check (Daily)

```bash
# Run weekly (or more often if concerned)
npm run test:health
```

**What to look for:**
- ✅ `"healthy": true`
- ✅ `"cache_exists": true`
- ✅ `"shop_id_stored": true`
- ✅ `"product_count": 17` (or your current count)
- ✅ No errors array

**If unhealthy:**
1. Check Vercel dashboard for errors
2. Verify Upstash Redis is running
3. Check email for alert notifications
4. Run manual refresh: `npm run refresh:cache` (with REFRESH_SECRET)

---

## Weekly Monitoring Tasks

### 1. **Log Review** (Monday)

**Where to find logs:**
- Vercel Dashboard → Deployments → Function Logs
- Or: `vercel logs` (CLI)
- Or: Export logs from Vercel

**What to check:**

```json
// Look for ERROR-level logs
{"level":"ERROR", ...}

// Look for suspicious WARN-level logs
{"level":"WARN", "event":"RATE_LIMITED", ...}
{"level":"WARN", "event":"AUTH_FAILED", ...}
```

**Command to filter logs (if exported):**
```bash
# Find all errors
grep '"level":"ERROR"' logs.json

# Find rate limit events
grep '"event":"RATE_LIMITED"' logs.json

# Find auth failures
grep '"event":"AUTH_FAILED"' logs.json
```

**Response:**
- 1-2 auth failures/week: Normal (typos, testing)
- 10+ auth failures/week: Investigate (possible attack)
- Rate limit events: Expected (indicates limits working)
- Errors: Investigate each one

---

### 2. **Performance Metrics** (Wednesday)

**Where to view:**
- Vercel Dashboard → Analytics
- Function latency, error rate, invocations

**Metrics to monitor:**

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cache latency | <100ms | 100-500ms | >500ms |
| Auth latency | <500ms | 500-2000ms | >2000ms |
| Error rate | <0.1% | 0.1-1% | >1% |
| Uptime | >99.9% | 99-99.9% | <99% |

---

### 3. **Security Review** (Friday)

**Questions to ask:**
- [ ] Any suspicious IP addresses in logs?
- [ ] Any spike in rate limit events?
- [ ] Any unusual error patterns?
- [ ] All secrets still secure in Vercel?
- [ ] Any unexpected OAuth attempts?

**Red flags:**
- 🚩 Same IP hitting rate limit repeatedly
- 🚩 Auth failures from unusual locations
- 🚩 Error rate spike
- 🚩 Cache expiration notifications

---

## Email Alerts

### When You'll Get Emails

**From:** Resend (resend.dev)
**To:** alerts@mindcubby.com

**Triggers:**

1. **Cache Expired**
   - Reason: Cache older than 24 hours
   - Action: Manual refresh or check cron

2. **Cache Empty**
   - Reason: 0 products in cache
   - Action: Re-authorize or check Etsy API

3. **Shop ID Missing**
   - Reason: shop_id not in Redis
   - Action: Re-authorize via `/api/auth/etsy`

4. **Health Check Failed**
   - Reason: Any of above + includes details
   - Action: See email for specific issue

### Responding to Alerts

**Email contains:**
- Timestamp of failure
- Which check failed
- Why it failed
- Suggested remediation

**Action:**
1. Read email to understand issue
2. Run `npm run test:health` to verify
3. Take action (refresh cache, re-authorize, etc.)
4. Verify fix: Email confirms when back to healthy

---

## Monthly Maintenance

### 1. **Log Export & Archive** (1st of month)

```bash
# Export logs from last 30 days
vercel logs --since "30d ago" > logs-$(date +%Y-%m).json

# Store securely (not in git)
```

**Why:** Compliance, troubleshooting historical issues

---

### 2. **Secret Rotation** (1st of month)

**Current secrets:**
- `AUTH_SECRET` - OAuth endpoint protection
- `REFRESH_SECRET` - Manual refresh protection

**Steps to rotate:**

1. Generate new secret:
   ```bash
   openssl rand -hex 16
   ```

2. Update in Vercel:
   - Vercel dashboard → Settings → Environment Variables
   - Update `AUTH_SECRET` (new value)
   - Auto-redeploy happens

3. Update in password manager:
   - Replace old value with new

4. Test new secret:
   ```bash
   ./authorize-oauth.sh NEW_SECRET_HERE
   ```

5. Document rotation date in log file

---

### 3. **Dependency Check** (15th of month)

```bash
# Check for updates
npm outdated

# If updates available
npm update

# Re-test
npm run test:health
```

**Current versions:**
- redis: ^6.2.1
- resend: ^6.22.0
- @vercel/kv: ^0.2.4 (deprecated, not actively used)

---

### 4. **Rate Limit Tuning** (End of month)

**Review:** Are current limits appropriate?

| Endpoint | Current Limit | Status |
|----------|---------------|--------|
| `/api/etsy/cache` | 100 req/15min | Public access, high limit OK |
| `/api/auth/etsy` | 20 attempts/15min | Admin only, reasonable |
| `/api/etsy/refresh-cache` | 10 attempts/hour | Admin only, reasonable |

**Decision matrix:**
- ✅ Getting rate limit emails? Limits too strict → increase
- ✅ No rate limits? Limits too loose → decrease
- ✅ No complaints? Limits are good → keep same

---

## Quarterly Tasks

### 1. **Security Audit** (Every 90 days)

Checklist:
- [ ] Review all Vercel environment variables
- [ ] Verify AUTH_SECRET not in git/logs
- [ ] Check REFRESH_SECRET not in git/logs
- [ ] Review Etsy app OAuth settings
- [ ] Verify custom domain SSL cert expiry date
- [ ] Audit Upstash Redis access logs
- [ ] Check Resend API key usage

---

### 2. **Capacity Planning** (Q4)

**Monitor:**
- Redis usage (store size)
- Vercel invocations (cost)
- Logging volume (can disable DEBUG if needed)

**Decisions:**
- Scale up if approaching limits
- Consider paid tier if adding features

---

## Incident Response

### **If Rate Limiting Seems Too Strict**

**Symptom:** Legitimate users getting 429 errors

**Investigation:**
1. Check rate limit events in logs
2. Identify which IPs are being limited
3. Check if limit threshold is too low

**Resolution:**
```javascript
// In api/middleware/rate-limit.js, adjust thresholds:
checkRateLimit(req, { maxRequests: 200, windowMs: 15 * 60 * 1000 })
```

---

### **If Cache Isn't Refreshing**

**Symptom:** Health check shows expired cache, cron not running

**Investigation:**
1. Verify Vercel Cron is enabled (Settings → Cron Jobs)
2. Check `/api/etsy/cron-refresh` logs
3. Verify `ETSY_API_KEY` and `ETSY_API_SECRET` are set

**Resolution:**
```bash
# Manual refresh while investigating
npm run refresh:cache
```

---

### **If Auth Failures Spike**

**Symptom:** Many AUTH_FAILED log events

**Investigation:**
1. Check if AUTH_SECRET was rotated (check logs)
2. See if attacker is guessing AUTH_SECRET
3. Check IP addresses in WARN logs

**Resolution:**
- Rotate AUTH_SECRET immediately
- Consider rate limiting OAuth to 5 attempts/15min
- Monitor for continued attacks

---

### **If Cache is Empty After Auth**

**Symptom:** Authorization succeeds but no products show

**Investigation:**
1. Check if shop_id is in Redis
2. Verify Etsy API credentials
3. Check if shop has products

**Resolution:**
```bash
# Re-authorize to trigger full flow
./authorize-oauth.sh YOUR_AUTH_SECRET

# Wait 30 seconds
# Check health
npm run test:health
```

---

## Performance Baselines

**First week (Aug 23-30):** Establish baselines

| Metric | Baseline | Note |
|--------|----------|------|
| Cache hit latency | ___ ms | TBD after monitoring |
| Auth latency | ___ ms | TBD after monitoring |
| Cache size | ___ MB | TBD after monitoring |
| Daily invocations | ___ | TBD after monitoring |
| Error rate | ___% | Should be <0.1% |

---

## Next Review Date

- **Next Daily Check:** Tomorrow
- **Next Weekly Review:** August 30 (logs + performance)
- **Next Monthly Maintenance:** September 1 (secrets + logs)
- **Next Quarterly Audit:** November 23 (security review)

---

## Important Contacts

- **Vercel Support:** https://vercel.com/support
- **Etsy API Support:** https://developers.etsy.com/support
- **Upstash Support:** https://upstash.com/support
- **Resend Support:** https://resend.com/support

---

## Quick Reference

### Useful Commands

```bash
# Health check
npm run test:health

# Manual cache refresh (requires REFRESH_SECRET)
npm run refresh:cache

# Authorize (requires AUTH_SECRET)
./authorize-oauth.sh YOUR_AUTH_SECRET

# View local logs (development)
tail -f logs.json

# Export Vercel logs
vercel logs --since "7d ago" > logs-weekly.json
```

### Important URLs

- **Shop:** https://shop.mindcubby.com/shop.html
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Upstash Console:** https://console.upstash.com
- **Resend Dashboard:** https://dashboard.resend.com

---

## Deployment Summary

**What was deployed (Aug 23):**
- ✅ Rate limiting middleware (100+ endpoints protected)
- ✅ Structured JSON logging (all requests logged)
- ✅ Security event logging (auth failures, rate limits, etc)
- ✅ Request duration tracking (performance monitoring)
- ✅ IP-based tracking (Vercel-aware)

**Status:** 🟢 All systems live and tested

**Next steps:** Monitor for 2-4 weeks, then implement MEDIUM priority improvements (Redis ACL, CSP headers)
