#!/bin/bash
# authorize-oauth.sh
# Securely initiate OAuth flow with auth token in header (not URL)
# Usage: ./authorize-oauth.sh your_auth_secret

AUTH_SECRET="${1:?Error: Auth secret required as first argument}"
DOMAIN="https://mindcubby.vercel.app"

echo "🔐 Initiating secure OAuth flow..."
echo "Auth method: POST with X-Auth-Token header (token hidden from URL)"
echo ""

# Make POST request with auth token in header
# curl will follow redirects automatically
curl -X POST "$DOMAIN/api/auth/etsy" \
  -H "X-Auth-Token: $AUTH_SECRET" \
  -L \
  -v

echo ""
echo "✅ OAuth flow initiated - check browser for Etsy login"
