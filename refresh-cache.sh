#!/bin/bash
# refresh-cache.sh
# Manually refresh MindCubby shop cache
# Usage: ./refresh-cache.sh

DOMAIN="https://mindcubby.com"
REFRESH_SECRET="${MINDCUBBY_REFRESH_SECRET:?Error: MINDCUBBY_REFRESH_SECRET not set. Set it first: export MINDCUBBY_REFRESH_SECRET=your_secret}"

echo "🔄 Refreshing MindCubby shop cache..."
echo "Domain: $DOMAIN"

RESPONSE=$(curl -sL -X GET "$DOMAIN/api/etsy/refresh-cache?secret=$REFRESH_SECRET")

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Parse response
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ Cache refreshed successfully!"
    exit 0
else
    echo ""
    echo "❌ Cache refresh failed"
    exit 1
fi
