#!/bin/bash
# authorize-oauth.sh
# Securely initiate OAuth flow with PKCE
# Automatically opens browser on macOS/Linux
# Usage: ./authorize-oauth.sh your_auth_secret

AUTH_SECRET="${1:?Error: Auth secret required as first argument}"
DOMAIN="https://mindcubby.com"

echo "🔐 Initiating secure OAuth flow..."
echo ""

# Open OAuth endpoint directly in browser
# The browser will set the necessary cookies and get redirected to Etsy
OAUTH_ENDPOINT="$DOMAIN/api/auth/etsy"

echo "🌐 Opening Etsy authorization in your browser..."
echo ""

# Open in browser
if command -v open &> /dev/null; then
  # macOS
  open "$OAUTH_ENDPOINT"
elif command -v xdg-open &> /dev/null; then
  # Linux
  xdg-open "$OAUTH_ENDPOINT"
elif command -v wsl-open &> /dev/null; then
  # Windows WSL
  wsl-open "$OAUTH_ENDPOINT"
else
  # Fallback: just show the URL
  echo "Please open this URL in your browser:"
  echo "$OAUTH_ENDPOINT"
fi

echo ""
echo "✅ Authorization page opened - approve access in Etsy"
