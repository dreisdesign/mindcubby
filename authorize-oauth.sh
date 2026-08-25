#!/bin/bash
# authorize-oauth.sh
# Securely initiate OAuth flow with auth token in header (not URL)
# Automatically opens browser on macOS/Linux
# Usage: ./authorize-oauth.sh your_auth_secret

AUTH_SECRET="${1:?Error: Auth secret required as first argument}"
DOMAIN="https://mindcubby.com"

echo "🔐 Initiating secure OAuth flow..."
echo "Auth method: POST with X-Auth-Token header (token hidden from URL)"
echo ""

# Extract OAuth URL from response headers
OAUTH_URL=$(curl -s -X POST "$DOMAIN/api/auth/etsy" \
  -H "X-Auth-Token: $AUTH_SECRET" \
  -L -v 2>&1 | grep "oauth/connect" | head -1 | sed 's/.*\(https:\/\/www.etsy.com[^[:space:]]*\).*/\1/')

if [ -z "$OAUTH_URL" ]; then
  echo "❌ Failed to get OAuth URL from server"
  exit 1
fi

echo "🌐 Opening Etsy authorization in your browser..."
echo ""

# Open in browser
if command -v open &> /dev/null; then
  # macOS
  open "$OAUTH_URL"
elif command -v xdg-open &> /dev/null; then
  # Linux
  xdg-open "$OAUTH_URL"
elif command -v wsl-open &> /dev/null; then
  # Windows WSL
  wsl-open "$OAUTH_URL"
else
  # Fallback: just show the URL
  echo "Please open this URL in your browser:"
  echo "$OAUTH_URL"
fi

echo ""
echo "✅ Authorization page opened - approve access in Etsy"
