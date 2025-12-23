#!/bin/bash

echo "🤖 Android Development Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Android Studio is installed
if [ ! -d "/Applications/Android Studio.app" ]; then
    echo -e "${YELLOW}⚙️  Android Studio is not installed yet${NC}"
    echo ""
    
    # Check if brew install is in progress
    if brew list --cask android-studio &> /dev/null; then
        echo -e "${GREEN}✓${NC} Android Studio is being installed via Homebrew"
    else
        echo "📥 Installing Android Studio via Homebrew..."
        brew install --cask android-studio
    fi
    
    echo ""
    echo "⏳ Waiting for Android Studio installation..."
    echo "   This will take several minutes..."
    
    # Wait for installation
    while [ ! -d "/Applications/Android Studio.app" ]; do
        sleep 5
        echo -n "."
    done
    echo ""
    echo -e "${GREEN}✓${NC} Android Studio installed"
fi

echo -e "${GREEN}✓${NC} Android Studio is installed"
echo ""

# Set ANDROID_HOME
ANDROID_HOME_PATH="$HOME/Library/Android/sdk"

echo "📍 Setting up environment variables..."
echo ""

# Check if ANDROID_HOME is already set
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚙️  Setting ANDROID_HOME...${NC}"
    
    # Add to shell profile
    SHELL_PROFILE=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    fi
    
    if [ -n "$SHELL_PROFILE" ]; then
        # Check if already in profile
        if ! grep -q "ANDROID_HOME" "$SHELL_PROFILE"; then
            echo "" >> "$SHELL_PROFILE"
            echo "# Android SDK" >> "$SHELL_PROFILE"
            echo "export ANDROID_HOME=\$HOME/Library/Android/sdk" >> "$SHELL_PROFILE"
            echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_PROFILE"
            echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_PROFILE"
            
            echo -e "${GREEN}✓${NC} Added to $SHELL_PROFILE"
        else
            echo -e "${GREEN}✓${NC} Already in $SHELL_PROFILE"
        fi
        
        # Export for current session
        export ANDROID_HOME=$HOME/Library/Android/sdk
        export PATH=$PATH:$ANDROID_HOME/emulator
        export PATH=$PATH:$ANDROID_HOME/platform-tools
    fi
else
    echo -e "${GREEN}✓${NC} ANDROID_HOME is set: $ANDROID_HOME"
fi
echo ""

# Check if SDK is installed
if [ ! -d "$ANDROID_HOME_PATH" ]; then
    echo -e "${YELLOW}⚠️  Android SDK not found at $ANDROID_HOME_PATH${NC}"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Open Android Studio"
    echo "   2. Click 'More Actions' → 'SDK Manager'"
    echo "   3. Install these SDK components:"
    echo "      • Android SDK Platform (API 34)"
    echo "      • Android SDK Build-Tools 34.0.0"
    echo "      • Android Emulator"
    echo "      • Android SDK Platform-Tools"
    echo "   4. Create an AVD (Android Virtual Device):"
    echo "      • Click 'More Actions' → 'Virtual Device Manager'"
    echo "      • Click 'Create Device'"
    echo "      • Select a device (e.g., Pixel 6)"
    echo "      • Download a system image (e.g., API 34)"
    echo "      • Finish setup"
    echo "   5. Run this script again"
    echo ""
    exit 0
else
    echo -e "${GREEN}✓${NC} Android SDK found"
    
    # Check for platform-tools
    if [ -d "$ANDROID_HOME_PATH/platform-tools" ]; then
        echo -e "${GREEN}✓${NC} Platform tools installed"
    else
        echo -e "${YELLOW}⚠${NC}  Platform tools not found"
    fi
    
    # Check for build-tools
    if [ -d "$ANDROID_HOME_PATH/build-tools" ]; then
        echo -e "${GREEN}✓${NC} Build tools installed"
    else
        echo -e "${YELLOW}⚠${NC}  Build tools not found"
    fi
fi
echo ""

# Check for Java
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} Java installed: $JAVA_VERSION"
else
    echo -e "${YELLOW}⚙️  Installing Java...${NC}"
    brew install openjdk@17
    
    if [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> "$HOME/.zshrc"
    fi
    
    echo -e "${GREEN}✓${NC} Java installed"
fi
echo ""

# Check if Gradle wrapper exists
cd "$(dirname "$0")/apps/mobile/android" || exit 1
echo "📂 Location: $(pwd)"
echo ""

if [ -f "gradlew" ]; then
    echo -e "${GREEN}✓${NC} Gradle wrapper found"
    
    # Make gradlew executable
    chmod +x gradlew
    
    echo ""
    echo -e "${GREEN}✅ Android setup complete!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Open Android Studio"
    echo "   2. Create/start an AVD (Virtual Device)"
    echo "   3. Run: cd apps/mobile && npm run android"
    echo ""
    echo "   OR test on physical device:"
    echo "   1. Enable USB debugging on your phone"
    echo "   2. Connect via USB"
    echo "   3. Run: cd apps/mobile && npm run android"
    echo ""
else
    echo -e "${YELLOW}⚠️  Android project not fully configured${NC}"
    echo ""
echo "Run: cd apps/mobile && npm run android"
    echo "Then run this script again"
fi
