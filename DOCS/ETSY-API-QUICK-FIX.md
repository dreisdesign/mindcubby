# Etsy API v3 Quick Fix Reference

**Date**: 2025-01-XX  
**Status**: ✅ FIXED AND READY FOR TESTING

## Critical Requirements (Non-Negotiable)

### 1. The x-api-key Header (MANDATORY)

**Every single Etsy API v3 request MUST include this header:**

```javascript
headers: {
    'Authorization': `Bearer ${accessToken}`,
    'x-api-key': `${ETSY_API_KEY}:${ETSY_API_SECRET}`,  // ← CRITICAL!
    'Content-Type': 'application/json'
}
```

**Format**: `keystring:shared_secret` (colon separator, no spaces)

### 2. Correct Endpoint for User Info

**Use this:**
```
https://api.etsy.com/v3/application/users/me
```

**NOT these:**
- ❌ `https://api.etsy.com/application/me` (doesn't exist)
- ❌ `https://api.etsy.com/oauth/me` (not implemented)
- ❌ `https://openapi.etsy.com/...` (not reliable)

### 3. Extract user_id from Token Prefix

Etsy access tokens have format: `"12345678.actual_token_string"`

```javascript
const tokenParts = accessToken.split('.');
const userId = parseInt(tokenParts[0], 10);
```

### 4. Required OAuth Scopes

```javascript
const scope = 'listings_r shops_r';  // Both required!
```

- `listings_r`: Read shop listings
- `shops_r`: Access /users/me endpoint

## What Was Fixed

### File: api/auth/etsy/index.js
- ✅ Changed scope from `listings_r` to `listings_r shops_r`

### File: api/auth/etsy/callback.js
- ✅ Extract user_id from token prefix: `accessToken.split('.')[0]`
- ✅ Store as `etsy_user_id` cookie

### File: api/etsy/products.js
- ✅ Complete rewrite with simplified flow:
  1. Check for `etsy_token` cookie
  2. Validate `ETSY_API_KEY` and `ETSY_API_SECRET` env vars
  3. Call `/v3/application/users/me` to get `shop_id`
  4. Call `/v3/application/shops/{shop_id}/listings`
- ✅ Added required `x-api-key` header to all Etsy API calls
- ✅ Removed broken discovery logic
- ✅ Better error handling and logging

## Testing Instructions

### 1. Verify Environment Variables

In Vercel dashboard, confirm these are set:
```
ETSY_API_KEY=your_keystring_here
ETSY_API_SECRET=your_shared_secret_here
```

### 2. Deploy

```bash
git add .
git commit -m "Fix Etsy API integration"
git push
```

### 3. Test OAuth Flow

1. Visit: `https://your-domain.vercel.app/etsy-connect.html`
2. Click "Connect to Etsy"
3. Approve authorization on Etsy
4. Should redirect back to your site

### 4. Check Logs (Vercel Dashboard)

Look for these SUCCESS markers:
```
OAuth token response keys: access_token,refresh_token,...
Extracted user_id from token prefix: 12345678
[Products] ✅ Token found
[Products] ✅ Got shop_id: 12345678
[Products] ✅ Got listings data. Count: 5
```

### 5. Fetch Products

Click "Fetch Products" button - should display your listings

## Troubleshooting

### Error: "Not authenticated"
- **Check**: `etsy_token` cookie exists (browser DevTools → Application → Cookies)
- **Fix**: Complete OAuth flow again

### Error: "Server configuration error"
- **Check**: Environment variables in Vercel
- **Fix**: Add `ETSY_API_KEY` and `ETSY_API_SECRET`, then redeploy

### Error: 401 Unauthorized
- **Check**: x-api-key header is being sent
- **Check**: Format is `keystring:secret` (colon separator)
- **Fix**: Verify env vars are correct

### Error: 403 Forbidden
- **Check**: OAuth scope includes both `listings_r` and `shops_r`
- **Fix**: Update Etsy app settings, reconnect

### Error: 404 Not Found
- **Check**: Using correct endpoint `/v3/application/users/me`
- **Check**: URL doesn't have typos

### Error: "No shop found"
- **Check**: Etsy account actually has a shop
- **Check**: Logs show what `/users/me` returned

## Files Changed

1. [api/auth/etsy/index.js](../api/auth/etsy/index.js) - OAuth scope update
2. [api/auth/etsy/callback.js](../api/auth/etsy/callback.js) - user_id extraction
3. [api/etsy/products.js](../api/etsy/products.js) - Complete rewrite

## For Less Powerful AI Models

If you need to debug this with a smaller model, tell it:

> "The Etsy API v3 integration was failing because:
> 1. Missing x-api-key header (format: `keystring:secret`) on all API calls
> 2. Using wrong endpoint `/application/me` instead of `/v3/application/users/me`
> 3. Not extracting user_id from access_token prefix
> 
> All fixes have been applied. Check the files listed above. The user needs to test by deploying to Vercel and trying the OAuth flow."

## References

- Full docs: [ETSY-VERCEL-INTEGRATION.md](./ETSY-VERCEL-INTEGRATION.md)
- Etsy API docs: https://developers.etsy.com/documentation/reference/
- OAuth PKCE spec: https://datatracker.ietf.org/doc/html/rfc7636
