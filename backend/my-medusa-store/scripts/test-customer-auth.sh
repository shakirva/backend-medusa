#!/bin/bash
# Quick test script for customer auth flow
# Run: bash scripts/test-customer-auth.sh

BASE_URL="https://admin.markasouqs.com"
API_KEY="pk_3971873a84ad4ec5ea711738227a4be2f078a2fd872f40125628afc860b9887b"

echo "=== Step 1: Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/customer/emailpass" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No token received!"
  exit 1
fi

echo ""
echo "Token (first 50 chars): ${TOKEN:0:50}..."

echo ""
echo "=== Step 2: Try /store/customers/me with Bearer token ==="
ME_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/store/customers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-publishable-api-key: $API_KEY")
echo "Response: $ME_RESPONSE"

echo ""
echo "=== Step 3: Try POST /auth/session with token in body ==="
SESSION_RESPONSE=$(curl -s -c cookies.txt -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/auth/session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
echo "Session Response: $SESSION_RESPONSE"

echo ""
echo "=== Step 4: Try /store/customers/me with session cookie ==="
ME_COOKIE_RESPONSE=$(curl -s -b cookies.txt -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/store/customers/me" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: $API_KEY")
echo "Response with Cookie: $ME_COOKIE_RESPONSE"

echo ""
echo "=== Step 5: Register new user + test ==="
NEW_EMAIL="testuser_$(date +%s)@test.com"
echo "Registering: $NEW_EMAIL"
REG_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/auth/customer/emailpass/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"Test12345\"}")
echo "Register Response: $REG_RESPONSE"

REG_TOKEN=$(echo "$REG_RESPONSE" | head -1 | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$REG_TOKEN" ]; then
  echo ""
  echo "=== Step 6: Create customer profile ==="
  CREATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/store/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $REG_TOKEN" \
    -H "x-publishable-api-key: $API_KEY" \
    -d '{"first_name":"Test","last_name":"User"}')
  echo "Create Customer Response: $CREATE_RESPONSE"

  echo ""
  echo "=== Step 7: Now try /store/customers/me ==="
  FINAL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/store/customers/me" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $REG_TOKEN" \
    -H "x-publishable-api-key: $API_KEY")
  echo "Final Response: $FINAL_RESPONSE"
fi

rm -f cookies.txt
echo ""
echo "=== DONE ==="
