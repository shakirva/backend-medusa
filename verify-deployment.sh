#!/bin/bash

# Marqa Souq Deployment Verification Script
# Run this after deploying to verify everything is working

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                        ║"
echo "║         MARQA SOUQ DEPLOYMENT VERIFICATION - March 23, 2026           ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to check test result
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
  fi
}

echo "🔍 VERIFICATION TESTS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Test 1: Backend Health
echo "Test 1: Backend Service"
curl -s http://localhost:9000/health > /dev/null 2>&1
check_result "Backend is responding (http://localhost:9000/health)"

# Test 2: Frontend Health
echo "Test 2: Frontend Service"
curl -s http://localhost:3000 > /dev/null 2>&1
check_result "Frontend is responding (http://localhost:3000)"

# Test 3: Database Connection
echo "Test 3: Database Connection"
if command -v psql &> /dev/null; then
  psql -h localhost -U marqa_user -d marqa_souq -c "SELECT 1" > /dev/null 2>&1
  check_result "PostgreSQL database is accessible"
else
  echo -e "${YELLOW}⚠️  SKIPPED${NC}: psql not found in PATH"
fi

# Test 4: Webhook Endpoint
echo "Test 4: Webhook Endpoint"
curl -s -X OPTIONS http://localhost:9000/odoo/webhooks/products > /dev/null 2>&1
check_result "Webhook endpoint is accessible"

# Test 5: Check TypeScript compilation
echo "Test 5: Backend Build Artifacts"
if [ -d ".medusa/server" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Backend build directory exists"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Backend build directory missing"
  ((FAILED++))
fi

# Test 6: Check Frontend build
echo "Test 6: Frontend Build Artifacts"
if [ -d "frontend/markasouq-web/.next" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Frontend build directory exists"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Frontend build directory missing"
  ((FAILED++))
fi

# Test 7: Check webhook secret
echo "Test 7: Environment Configuration"
if [ -n "$ODOO_WEBHOOK_SECRET" ]; then
  echo -e "${GREEN}✅ PASS${NC}: ODOO_WEBHOOK_SECRET is set"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  WARN${NC}: ODOO_WEBHOOK_SECRET not set in environment"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Test 8: Category Sync Feature
echo "Test 8: Test Webhook with Sample Product"
echo ""
echo "Sending test product with new category..."

RESPONSE=$(curl -s -X POST http://localhost:9000/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -H "X-Odoo-Webhook-Secret: marqa-odoo-webhook-2026" \
  -d '{
    "event_type": "product.created",
    "product": {
      "odoo_id": 999999,
      "name": "Deployment Test Product",
      "default_code": "TEST-DEPLOY-001",
      "list_price": 99.99,
      "categ_id": [999, "Test/Category/ForDeployment"],
      "qty_available": 10,
      "is_published": true,
      "image_url": "https://via.placeholder.com/500x500"
    }
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ PASS${NC}: Webhook processed successfully"
  echo "Response: $RESPONSE"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: Webhook test failed"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Summary
TOTAL=$((PASSED + FAILED))
echo "📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════════════"
echo -e "Total Tests:     $TOTAL"
echo -e "Passed:          ${GREEN}$PASSED${NC}"
echo -e "Failed:          ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✨ ALL TESTS PASSED ✨${NC}"
  echo ""
  echo "Deployment Status: ✅ READY FOR PRODUCTION"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  echo ""
  echo "Please review the failures above and fix before deploying"
  exit 1
fi
