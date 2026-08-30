#!/bin/bash
# get-shop-id.sh
# Get your real Etsy shop_id using your API credentials
# Usage: ./get-shop-id.sh your_keystring your_shared_secret

KEYSTRING="${1:?Error: Keystring required as first argument}"
SHARED_SECRET="${2:?Error: Shared secret required as second argument}"

echo "🔍 Fetching your Etsy shop_id..."
echo ""

# Call Etsy API to get user info (requires app credentials)
RESPONSE=$(curl -s -X GET "https://api.etsy.com/v3/application/users/me" \
  -H "x-api-key: ${KEYSTRING}:${SHARED_SECRET}" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract shop_id if present
SHOP_ID=$(echo "$RESPONSE" | jq -r '.shop_id // empty' 2>/dev/null)

if [ -n "$SHOP_ID" ]; then
    echo ""
    echo "✅ Your shop_id is: $SHOP_ID"
    echo ""
    echo "Add this to Vercel:"
    echo "ETSY_SHOP_ID = $SHOP_ID"
else
    echo ""
    echo "❌ Could not find shop_id in response"
fi
