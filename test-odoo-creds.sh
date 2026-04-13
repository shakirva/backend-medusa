#!/bin/bash

echo "🔍 Testing different Odoo credential combinations..."
echo "============================================="

ODOO_URL="https://oskarllc-new-27289548.dev.odoo.com"

# Test different combinations
echo ""
echo "Test 1: SYG + S123456 (current .env)"
curl -s -X POST ${ODOO_URL}/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate", 
      "args": ["oskarllc-new-27289548", "SYG", "S123456", {}]
    },
    "id": 1
  }' | jq -r '.result'

echo ""
echo "Test 2: admin + S123456"
curl -s -X POST ${ODOO_URL}/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["oskarllc-new-27289548", "admin", "S123456", {}]
    },
    "id": 1
  }' | jq -r '.result'

echo ""
echo "Test 3: SYG + admin"
curl -s -X POST ${ODOO_URL}/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["oskarllc-new-27289548", "SYG", "admin", {}]
    },
    "id": 1
  }' | jq -r '.result'

echo ""
echo "Test 4: admin + admin"
curl -s -X POST ${ODOO_URL}/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["oskarllc-new-27289548", "admin", "admin", {}]
    },
    "id": 1
  }' | jq -r '.result'

echo ""
echo "Test 5: SYG + API Key from env"
curl -s -X POST ${ODOO_URL}/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["oskarllc-new-27289548", "SYG", "5941b8e316918f7753a4b9845e0315aa072686d4", {}]
    },
    "id": 1
  }' | jq -r '.result'

echo ""
echo "============================================="
echo "✅ If any test shows a number (like 1,2,3), that's a valid UID"
echo "❌ If all tests show 'false', credentials need to be updated"