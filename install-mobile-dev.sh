#!/bin/bash

echo "📱 Creator Mode - Mobile Development Installation"
echo "================================================="
echo ""
echo "This will set up iOS and Android development environments"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=8
current_step=0

print_step() {
    current_step=$((current_step + 1))
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step $current_step/$TOTAL_STEPS:${NC} $1"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================
# STEP 1: Check Prerequisites
# ============================================
print_step "Checking Prerequisites"

if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew is not installed${NC}"
    echo ""
    echo "Install Homebrew first:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi
echo -e "${GREEN}✓${NC} Homebrew installed"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"

# ============================================
# STEP 2: Install Java (for Android)
# ============================================
print_step "Installing Java (required for Android)"

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} Java already installed: $JAVA_VERSION"
else
    echo "Installing OpenJDK 17..."
    brew install openjdk@17
    
    # Add to PATH
    if [ -f "$HOME/.zshrc" ]; then
        if ! grep -q "openjdk@17" "$HOME/.zshrc"; then
            echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> "$HOME/.zshrc"
        fi
    fi
    
    echo -e "${GREEN}✓${NC} Java installed"
fi

# ============================================
# STEP 3: Install CocoaPods (for iOS)
# ============================================
print_step "Installing CocoaPods (required for iOS)"

if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✓${NC} CocoaPods already installed: $POD_VERSION"
else
    echo "Installing CocoaPods..."
    brew install cocoapods
    echo -e "${GREEN}✓${NC} CocoaPods installed"
fi

# ============================================
# STEP 4: Check/Install Xcode
# ============================================
print_step "Checking Xcode Installation"

if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version 2>&1 | head -n 1)
    
    if [[ "$XCODE_VERSION" == *"xcode-select"* ]]; then
        echo -e "${YELLOW}⚠️  Xcode is not fully installed${NC}"
        echo ""
        echo "📥 Please install Xcode:"
        echo "   1. Open the App Store"
        echo "   2. Search for 'Xcode'"
        echo "   3. Click 'Install' (free, ~15GB)"
        echo "   4. Run this script again after installation"
        echo ""
        echo -e "${BLUE}💡 Continuing with Android setup...${NC}"
    else
        echo -e "${GREEN}✓${NC} Xcode installed: $XCODE_VERSION"
        XCODE_READY=true
    fi
else
    echo -e "${YELLOW}⚠️  Xcode is not installed${NC}"
    echo ""
    echo "📥 To enable iOS development:"
    echo "   1. Open the App Store"
    echo "   2. Search for 'Xcode'"
    echo "   3. Click 'Install' (free, ~15GB)"
    echo "   4. Run this script again"
    echo ""
    echo -e "${BLUE}💡 Continuing with Android setup...${NC}"
    XCODE_READY=false
fi

# ============================================
# STEP 5: Install Android Studio
# ============================================
print_step "Installing Android Studio"

if [ -d "/Applications/Android Studio.app" ]; then
    echo -e "${GREEN}✓${NC} Android Studio already installed"
else
    echo "Installing Android Studio via Homebrew..."
    echo "This will download ~3GB and may take 10-20 minutes..."
    echo ""
    
    brew install --cask android-studio
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Android Studio installed"
    else
        echo -e "${YELLOW}⚠${NC}  Installation in progress or failed"
        echo "   Check: brew list --cask android-studio"
    fi
fi

# ============================================
# STEP 6: Set up Android Environment
# ============================================
print_step "Configuring Android Environment"

ANDROID_HOME_PATH="$HOME/Library/Android/sdk"

# Add Android environment variables
SHELL_PROFILE=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [ -n "$SHELL_PROFILE" ]; then
    if ! grep -q "ANDROID_HOME" "$SHELL_PROFILE"; then
        echo "" >> "$SHELL_PROFILE"
        echo "# Android SDK" >> "$SHELL_PROFILE"
        echo "export ANDROID_HOME=\$HOME/Library/Android/sdk" >> "$SHELL_PROFILE"
        echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_PROFILE"
        echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_PROFILE"
        
        echo -e "${GREEN}✓${NC} Added Android environment variables to $SHELL_PROFILE"
    else
        echo -e "${GREEN}✓${NC} Android environment variables already configured"
    fi
fi

# Export for current session
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# ============================================
# STEP 7: iOS Setup (if Xcode is ready)
# ============================================
if [ "$XCODE_READY" = true ]; then
    print_step "Setting up iOS Development"
    
    # Switch to Xcode
    CURRENT_DEV_DIR=$(xcode-select -p)
    if [[ "$CURRENT_DEV_DIR" == *"CommandLineTools"* ]]; then
        echo "Switching to Xcode developer directory..."
        sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
    fi
    
    # Accept license
    sudo xcodebuild -license accept 2>/dev/null
    
    # Run first launch
    sudo xcodebuild -runFirstLaunch 2>/dev/null
    
    echo -e "${GREEN}✓${NC} Xcode configured"
    
    # Install iOS pods
    if [ -f "apps/mobile/ios/Podfile" ]; then
        echo ""
        echo "Installing iOS dependencies (pods)..."
        echo "This may take 5-10 minutes..."
        cd apps/mobile/ios
        pod install
        cd ../../..
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} iOS pods installed"
            IOS_READY=true
        else
            echo -e "${YELLOW}⚠${NC}  Pod installation had issues"
            IOS_READY=false
        fi
    fi
fi

# ============================================
# STEP 8: Final Status
# ============================================
print_step "Installation Complete!"

echo "📊 Setup Summary:"
echo ""

# Node.js
echo -e "${GREEN}✓${NC} Node.js & npm"

# Java
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓${NC} Java (for Android)"
else
    echo -e "${RED}✗${NC} Java"
fi

# CocoaPods
if command -v pod &> /dev/null; then
    echo -e "${GREEN}✓${NC} CocoaPods (for iOS)"
else
    echo -e "${RED}✗${NC} CocoaPods"
fi

# Xcode
if [ "$XCODE_READY" = true ]; then
    echo -e "${GREEN}✓${NC} Xcode"
    if [ "$IOS_READY" = true ]; then
        echo -e "${GREEN}✓${NC} iOS pods installed"
    else
        echo -e "${YELLOW}⚠${NC} iOS pods (run: cd apps/mobile/ios && pod install)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Xcode (install from App Store)"
fi

# Android Studio
if [ -d "/Applications/Android Studio.app" ]; then
    echo -e "${GREEN}✓${NC} Android Studio"
else
    echo -e "${YELLOW}⚠${NC} Android Studio (may still be installing)"
fi

# Environment
if [ -n "$ANDROID_HOME" ] || grep -q "ANDROID_HOME" "$SHELL_PROFILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Android environment variables"
else
    echo -e "${YELLOW}⚠${NC} Android environment (added to shell profile)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""

if [ "$IOS_READY" = true ]; then
    echo -e "${GREEN}✅ iOS is ready!${NC}"
    echo "   Run: cd apps/mobile && npm run ios"
    echo ""
else
    if [ "$XCODE_READY" = true ]; then
        echo -e "${YELLOW}⚙️  Complete iOS setup:${NC}"
        echo "   ./setup-ios.sh"
        echo ""
    else
        echo -e "${YELLOW}⚙️  For iOS development:${NC}"
        echo "   1. Install Xcode from App Store"
        echo "   2. Run: ./setup-ios.sh"
        echo ""
    fi
fi

if [ -d "/Applications/Android Studio.app" ]; then
    echo -e "${YELLOW}⚙️  Complete Android setup:${NC}"
    echo "   1. Open Android Studio"
    echo "   2. Install SDK components (SDK Manager)"
    echo "   3. Create an AVD (Virtual Device Manager)"
    echo "   4. Run: ./setup-android.sh"
    echo "   5. Run: cd apps/mobile && npm run android"
    echo ""
else
    echo -e "${YELLOW}⚙️  Android Studio may still be installing${NC}"
    echo "   Check: ls -la '/Applications/Android Studio.app'"
    echo "   Or wait a few more minutes and run: ./setup-android.sh"
    echo ""
fi

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • MOBILE_SETUP_GUIDE.md - Detailed setup instructions"
echo "   • START_HERE.md - Quick start guide"
echo "   • setup-ios.sh - iOS-specific setup"
echo "   • setup-android.sh - Android-specific setup"
echo ""

echo -e "${BLUE}🔍 Verify Setup:${NC}"
echo "   ./verify-setup.sh"
echo ""

# Reload shell hint
if [ -n "$SHELL_PROFILE" ]; then
    echo -e "${YELLOW}💡 Important:${NC} Restart your terminal or run:"
    echo "   source $SHELL_PROFILE"
    echo ""
fi

echo -e "${GREEN}🎉 Installation script complete!${NC}"
echo ""
