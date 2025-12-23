#!/bin/bash

# Unscroller - Verify All Fixes Script
# This script verifies that all fixes were applied correctly

echo "🔍 Unscroller - Verifying All Fixes"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
FAILURES=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $2 (missing: $1)"
        ((FAILURES++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $2 (missing: $1)"
        ((FAILURES++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $3 (pattern not found in $1)"
        ((FAILURES++))
    fi
}

echo "1. Environment Configuration"
echo "----------------------------"
check_file "apps/backend/.env.example" "Environment template exists"
check_content "apps/backend/.env.example" "OPENAI_DAILY_BUDGET" "AI budget configuration present"
check_content "apps/backend/.env.example" "ALLOWED_ORIGINS" "CORS configuration present"
check_content "apps/backend/.env.example" "ENABLE_DATABASE" "Database toggle present"
echo ""

echo "2. Policy Key Management"
echo "------------------------"
check_file "scripts/generate-policy-keys.sh" "Key generation script exists"
check_dir "apps/backend/keys" "Keys directory exists"
check_file "apps/backend/keys/policy-private.pem" "Private key generated"
check_file "apps/backend/keys/policy-public.pem" "Public key generated"
check_content ".gitignore" "*.pem" "Keys are gitignored"
echo ""

echo "3. CORS Security Fix"
echo "--------------------"
check_content "apps/backend/src/main.ts" "ALLOWED_ORIGINS" "CORS whitelist implemented"
check_content "apps/backend/src/main.ts" "origin:" "CORS configuration present"
echo ""

echo "4. Mobile Configuration"
echo "-----------------------"
check_file "apps/mobile/src/config/environment.ts" "Environment config created"
check_content "apps/mobile/src/services/policy.ts" "CONFIG" "Policy service uses config"
check_content "apps/mobile/src/services/subscription.ts" "CONFIG" "Subscription service uses config"
check_content "apps/mobile/src/services/supabase.ts" "CONFIG" "Supabase service uses config"
echo ""

echo "5. Database Logic Simplification"
echo "---------------------------------"
check_content "apps/backend/src/app.module.ts" "ENABLE_DATABASE" "Simplified database conditional"
echo ""

echo "6. Puppeteer Lifecycle"
echo "----------------------"
check_content "apps/backend/src/ai/url-discovery.service.ts" "OnModuleDestroy" "Lifecycle hooks implemented"
check_content "apps/backend/src/ai/url-discovery.service.ts" "ensureBrowser" "Proper browser management"
check_content "apps/backend/src/ai/url-discovery.service.ts" "cleanup()" "Cleanup method present"
echo ""

echo "7. AI Cost Controls"
echo "-------------------"
check_content "apps/backend/src/ai/openai.service.ts" "dailyBudget" "Budget tracking implemented"
check_content "apps/backend/src/ai/openai.service.ts" "checkBudget" "Budget checking implemented"
check_content "apps/backend/src/ai/openai.service.ts" "trackUsage" "Usage tracking implemented"
check_content "apps/backend/src/ai/daily-analysis.service.ts" "ENABLE_AI_SCHEDULER" "Scheduler opt-in implemented"
echo ""

echo "8. Stripe Webhook Verification"
echo "-------------------------------"
check_content "apps/backend/src/subscription/subscription.controller.ts" "try {" "Error handling added"
check_content "apps/backend/src/subscription/subscription.controller.ts" "constructEvent" "Signature verification present"
echo ""

echo "9. Mobile Build Scripts"
echo "-----------------------"
check_content "apps/mobile/package.json" '"build":' "Build script added"
check_content "apps/mobile/package.json" '"build:ios":' "iOS build script added"
check_content "apps/mobile/package.json" '"build:android":' "Android build script added"
echo ""

echo "10. API Rate Limiting"
echo "---------------------"
check_content "apps/backend/src/main.ts" "express-rate-limit" "Rate limiting imported"
check_content "apps/backend/src/main.ts" "generalLimiter" "General rate limiter configured"
check_content "apps/backend/src/main.ts" "aiLimiter" "AI rate limiter configured"
echo ""

echo "11. Policy Version Consistency"
echo "-------------------------------"
check_content "policy/policy.json" '"version": "1.0.0"' "Semver version format"
echo ""

echo "12. Test Coverage"
echo "-----------------"
check_file "packages/policy-engine/src/__tests__/parser.test.ts" "Parser tests created"
check_file "packages/policy-engine/src/__tests__/compiler.test.ts" "Compiler tests created"
check_file "apps/backend/src/policy/__tests__/policy.service.test.ts" "Backend tests created"
check_file "packages/policy-engine/jest.config.js" "Jest configuration created"
echo ""

echo "Running Tests..."
echo "----------------"
cd packages/policy-engine
if npm test > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Policy engine tests passing"
    ((SUCCESS++))
else
    echo -e "${RED}❌${NC} Policy engine tests failing"
    ((FAILURES++))
fi
cd - > /dev/null
echo ""

echo "======================================"
echo "📊 Verification Summary"
echo "======================================"
echo -e "${GREEN}✅ Successful: $SUCCESS${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
fi
if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}❌ Failures: $FAILURES${NC}"
fi
echo ""

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All fixes verified successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env file: cp apps/backend/.env.example apps/backend/.env"
    echo "2. Add your API keys and credentials to .env"
    echo "3. Start backend: npm run backend"
    echo "4. Start mobile: npm run mobile"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some fixes are incomplete. Please review the failures above.${NC}"
    echo ""
    exit 1
fi

