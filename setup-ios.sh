#!/bin/bash

echo "🍎 iOS Development Setup"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed${NC}"
    echo ""
    echo "📥 Please install Xcode:"
    echo "   1. Open the App Store app"
    echo "   2. Search for 'Xcode'"
    echo "   3. Click 'Get' or 'Install'"
    echo "   4. Wait for download (~15GB, takes 30-60 minutes)"
    echo "   5. Run this script again"
    echo ""
    echo -e "${BLUE}💡 Tip: You can continue in another terminal while Xcode downloads${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Xcode is installed"
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo "   Version: $XCODE_VERSION"
echo ""

# Check if Xcode is properly selected
CURRENT_DEV_DIR=$(xcode-select -p)
if [[ "$CURRENT_DEV_DIR" == *"CommandLineTools"* ]]; then
    echo -e "${YELLOW}⚙️  Switching to Xcode developer directory...${NC}"
    sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Switched to Xcode"
    else
        echo -e "${RED}❌ Failed to switch to Xcode${NC}"
        echo "   Run manually: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Xcode developer directory is set correctly"
fi
echo ""

# Accept Xcode license
echo "📜 Checking Xcode license..."
sudo xcodebuild -license accept 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Xcode license accepted"
else
    echo -e "${YELLOW}⚠${NC}  Please accept license: sudo xcodebuild -license"
fi
echo ""

# Run first launch
echo "🚀 Running Xcode first launch..."
sudo xcodebuild -runFirstLaunch
echo -e "${GREEN}✓${NC} First launch complete"
echo ""

# Check CocoaPods
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}📦 Installing CocoaPods...${NC}"
    brew install cocoapods
    echo -e "${GREEN}✓${NC} CocoaPods installed"
else
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✓${NC} CocoaPods already installed: $POD_VERSION"
fi
echo ""

# Navigate to iOS directory
cd "$(dirname "$0")/apps/mobile/ios" || exit 1
echo "📂 Location: $(pwd)"
echo ""

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo -e "${RED}❌ Podfile not found${NC}"
    echo "   Run 'cd apps/mobile/ios && pod install' first"
    exit 1
fi

# Install pods
echo "📦 Installing iOS dependencies (pods)..."
echo "   This may take 5-10 minutes on first run..."
echo ""
pod install

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ iOS setup complete!${NC}"
    echo ""
    echo "🚀 Ready to run:"
    echo "   cd apps/mobile"
    echo "   npm run ios"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Pod installation failed${NC}"
    echo ""
    echo "Try these fixes:"
    echo "   1. pod deintegrate && pod install"
    echo "   2. pod repo update && pod install"
    echo "   3. Check error messages above"
    exit 1
fi
