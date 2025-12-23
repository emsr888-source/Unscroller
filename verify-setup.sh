#!/bin/bash

echo "🔍 Unscroller - Setup Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
fi

# Check npm
echo ""
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
fi

# Check dependencies
echo ""
echo "📦 Checking root dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root node_modules exists"
else
    echo -e "${RED}✗${NC} Root node_modules missing - run: npm install"
fi

# Check policy engine
echo ""
echo "🔧 Checking Policy Engine..."
if [ -d "packages/policy-engine/dist" ]; then
    echo -e "${GREEN}✓${NC} Policy engine built"
else
    echo -e "${YELLOW}⚠${NC} Policy engine not built - run: cd packages/policy-engine && npm run build"
fi

# Check backend
echo ""
echo "🖥️  Checking Backend..."
if [ -d "apps/backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Backend dependencies missing"
fi

if [ -f "apps/backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env missing - copy .env.example"
fi

# Check desktop
echo ""
echo "💻 Checking Desktop..."
if [ -d "apps/desktop/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Desktop dependencies installed"
else
    echo -e "${RED}✗${NC} Desktop dependencies missing"
fi

# Check mobile
echo ""
echo "📱 Checking Mobile..."
if [ -d "apps/mobile/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Mobile dependencies installed"
else
    echo -e "${RED}✗${NC} Mobile dependencies missing"
fi

# Check Xcode
echo ""
echo "🍎 Checking iOS Setup..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo -e "${GREEN}✓${NC} Xcode installed: $XCODE_VERSION"
    
    if [ -f "apps/mobile/ios/Podfile" ]; then
        echo -e "${GREEN}✓${NC} iOS Podfile exists"
        
        if [ -d "apps/mobile/ios/Pods" ]; then
            echo -e "${GREEN}✓${NC} iOS Pods installed"
        else
            echo -e "${YELLOW}⚠${NC} iOS Pods not installed - run: cd apps/mobile/ios && pod install"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} Xcode not installed (needed for iOS development)"
    echo "   Install from Mac App Store"
fi

# Check CocoaPods
echo ""
echo "🍫 Checking CocoaPods..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✓${NC} CocoaPods installed: $POD_VERSION"
else
    echo -e "${RED}✗${NC} CocoaPods not found"
fi

# Check Android
echo ""
echo "🤖 Checking Android Setup..."
if [ -d "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✓${NC} ANDROID_HOME set: $ANDROID_HOME"
else
    echo -e "${YELLOW}⚠${NC} ANDROID_HOME not set (needed for Android development)"
fi

# Summary
echo ""
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo ""
echo -e "${GREEN}✅ Ready to run:${NC}"
echo "   • Backend (after .env setup)"
echo "   • Desktop"
echo "   • Policy Engine"
echo ""
echo -e "${YELLOW}⚠️  Needs setup:${NC}"
echo "   • iOS development (install Xcode)"
echo "   • Android development (install Android Studio)"
echo ""
echo "🚀 Quick Start:"
echo "   Backend:  cd apps/backend && npm run start:dev"
echo "   Desktop:  cd apps/desktop && npm run dev"
echo "   Mobile:   cd apps/mobile && npm start"
echo ""
