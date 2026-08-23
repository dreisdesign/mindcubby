#!/bin/bash
# test-health.sh
# Local health check test
# Usage: npm run test:health

DOMAIN="${1:-https://shop.mindcubby.com}"

echo "🏥 Testing MindCubby health check..."
echo "Domain: $DOMAIN"
echo ""

# Run health check
RESPONSE=$(curl -s -X GET "$DOMAIN/api/health-check")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Parse response
if echo "$RESPONSE" | grep -q '"healthy":true'; then
    echo ""
    echo "✅ System is healthy!"
    exit 0
else
    echo ""
    echo "⚠️  System has issues - check details above"
    exit 1
fi
