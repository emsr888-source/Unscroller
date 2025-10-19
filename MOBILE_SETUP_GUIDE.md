# 📱 Mobile Development Setup - Complete Guide

## 🎯 Current Status

### ✅ What's Done
- [x] Android Studio downloading (in progress)
- [x] Java OpenJDK 17 installing
- [x] Setup scripts created (`setup-ios.sh` & `setup-android.sh`)
- [x] CocoaPods installed
- [x] Mobile dependencies installed

### ⏳ What's In Progress
- [ ] Android Studio installation (downloading ~3GB)
- [ ] Java installation
- [ ] Xcode installation (manual - from App Store)

---

## 🍎 iOS Setup

### Step 1: Install Xcode (Required)

**Xcode must be installed from the App Store:**

1. **Open App Store** on your Mac
2. **Search for "Xcode"**
3. **Click "Get" or "Install"**
   - Size: ~15GB
   - Time: 30-60 minutes depending on internet speed
4. **Wait for download** to complete

💡 **Tip:** You can continue with Android setup while Xcode downloads!

### Step 2: Run iOS Setup Script

Once Xcode is installed:

```bash
cd /Users/onalime/CreatorMode
./setup-ios.sh
```

This script will:
- ✓ Switch to Xcode developer directory
- ✓ Accept Xcode license
- ✓ Run first launch setup
- ✓ Verify CocoaPods installation
- ✓ Install iOS pods (dependencies)

### Step 3: Run iOS App

```bash
cd /Users/onalime/CreatorMode/apps/mobile
npm run ios
```

This will:
- Build the app
- Launch iOS Simulator
- Install app on simulator
- Start Metro bundler

### iOS Simulator Controls

- **Shake device**: Cmd + D (opens dev menu)
- **Reload**: Cmd + R
- **Toggle software keyboard**: Cmd + K
- **Home button**: Cmd + Shift + H
- **Lock screen**: Cmd + L

---

## 🤖 Android Setup

### Step 1: Android Studio Installation

**Android Studio is installing automatically via Homebrew** (in progress)

You can monitor the installation:
```bash
brew list --cask android-studio
```

Once installed, it will be at: `/Applications/Android Studio.app`

### Step 2: Configure Android Studio

**Open Android Studio** for the first time:

1. **Welcome screen** → Click "More Actions" → "SDK Manager"

2. **Install SDK Components** (check these):
   - ✓ Android SDK Platform 34 (latest)
   - ✓ Android SDK Build-Tools 34.0.0
   - ✓ Android Emulator
   - ✓ Android SDK Platform-Tools
   - ✓ Google Play Services (optional)

3. **Click "Apply"** to install

### Step 3: Create Android Virtual Device (AVD)

1. **Welcome screen** → "More Actions" → "Virtual Device Manager"
2. **Click "Create Device"**
3. **Select a device**: 
   - Recommended: Pixel 6 or Pixel 7
4. **Download a system image**:
   - Recommended: API Level 34 (latest)
   - Click "Download" next to the image
5. **Click "Finish"**

### Step 4: Run Android Setup Script

```bash
cd /Users/onalime/CreatorMode
./setup-android.sh
```

This script will:
- ✓ Verify Android Studio installation
- ✓ Set ANDROID_HOME environment variable
- ✓ Add Android tools to PATH
- ✓ Check Java installation
- ✓ Verify Gradle setup

### Step 5: Start AVD and Run App

**Option A: From Android Studio**
1. Open "Virtual Device Manager"
2. Click ▶️ next to your AVD
3. Wait for emulator to boot

**Option B: From Command Line**
```bash
# List available AVDs
emulator -list-avds

# Start an AVD
emulator -avd Pixel_6_API_34 &
```

**Then run the app:**
```bash
cd /Users/onalime/CreatorMode/apps/mobile
npm run android
```

### Android Emulator Controls

- **Open dev menu**: Cmd + M
- **Reload**: R R (press R twice)
- **Toggle software keyboard**: Cmd + K (works after focusing input)
- **Back button**: Cmd + Backspace
- **Home button**: Cmd + H

---

## 🔧 Environment Variables Setup

The setup scripts will configure these automatically, but here's what they do:

### For Android (~/.zshrc or ~/.bash_profile)

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Apply changes:**
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### Verify Setup

```bash
# Check Android
echo $ANDROID_HOME
adb --version
emulator -version

# Check iOS
xcodebuild -version
pod --version
```

---

## 🚀 Running the Apps

### iOS (Simulator)
```bash
cd /Users/onalime/CreatorMode/apps/mobile
npm run ios
```

**First build takes 5-10 minutes.** Subsequent builds are much faster.

### iOS (Physical Device)
```bash
# List connected devices
xcrun xctrace list devices

# Run on specific device
npm run ios -- --device "Your iPhone Name"
```

### Android (Emulator)
```bash
cd /Users/onalime/CreatorMode/apps/mobile

# Make sure AVD is running first!
npm run android
```

**First build takes 10-15 minutes.** Subsequent builds are faster.

### Android (Physical Device)

1. **Enable Developer Options** on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging → ON

3. **Connect via USB**

4. **Verify connection:**
   ```bash
   adb devices
   # Should show your device
   ```

5. **Run app:**
   ```bash
   cd /Users/onalime/CreatorMode/apps/mobile
   npm run android
   ```

---

## 🎯 Quick Commands Reference

```bash
# iOS
npm run ios                          # Run on simulator
npm run ios -- --device "Name"       # Run on device
npm run pods                         # Reinstall pods

# Android
npm run android                      # Run on emulator/device
cd android && ./gradlew clean        # Clean build
cd android && ./gradlew assembleDebug # Build APK

# Both
npm start                            # Start Metro bundler only
npm start -- --reset-cache           # Clear cache
```

---

## 🐛 Troubleshooting

### iOS Issues

**"xcodebuild requires Xcode"**
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**Pod install fails**
```bash
cd apps/mobile/ios
pod deintegrate
pod install
```

**Simulator won't boot**
```bash
# List simulators
xcrun simctl list devices

# Erase and reset
xcrun simctl erase all

# Or create new simulator in Xcode
```

### Android Issues

**"ANDROID_HOME not set"**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**"SDK location not found"**
1. Open Android Studio
2. SDK Manager
3. Note the "Android SDK Location"
4. Set ANDROID_HOME to that path

**Gradle build fails**
```bash
cd apps/mobile/android
./gradlew clean
cd ../..
npm run android
```

**Emulator won't start**
```bash
# Check available AVDs
emulator -list-avds

# Cold boot emulator
emulator -avd Pixel_6_API_34 -no-snapshot-load
```

**"No devices/emulators found"**
```bash
# Check connected devices
adb devices

# Kill and restart adb
adb kill-server
adb start-server
```

### Metro Bundler Issues

**Port 8081 in use**
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

**Cache issues**
```bash
npm start -- --reset-cache
```

**Watchman issues (Mac)**
```bash
brew install watchman
watchman watch-del-all
```

---

## 📊 Setup Progress Tracking

Run this to check your setup status:

```bash
cd /Users/onalime/CreatorMode
./verify-setup.sh
```

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Xcode download | 30-60 min |
| Xcode installation | 10-20 min |
| iOS first build | 5-10 min |
| Android Studio download | 10-20 min |
| Android Studio setup | 10-15 min |
| Android SDK download | 10-15 min |
| Android first build | 10-15 min |

**Total:** ~2-3 hours for complete setup (mostly waiting for downloads)

---

## 🎯 What to Do While Waiting

While Xcode/Android Studio downloads:

1. **Set up Backend**:
   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env
   ```

2. **Test Desktop App**:
   ```bash
   cd apps/desktop
   npm run dev
   ```

3. **Read Documentation**:
   - DEVELOPMENT.md
   - ARCHITECTURE.md
   - FEATURES.md

4. **Configure Supabase**:
   - Create project at supabase.com
   - Get API keys
   - Update mobile app config

---

## ✅ Verification Checklist

After setup, verify everything works:

### iOS
- [ ] Xcode installed
- [ ] Pods installed
- [ ] Simulator launches
- [ ] App builds successfully
- [ ] App runs on simulator
- [ ] Hot reload works

### Android
- [ ] Android Studio installed
- [ ] SDK components installed
- [ ] AVD created
- [ ] Emulator launches
- [ ] App builds successfully
- [ ] App runs on emulator
- [ ] Hot reload works

---

## 🆘 Need Help?

1. **Check logs**: Both iOS and Android show detailed error logs
2. **Run verification**: `./verify-setup.sh`
3. **Check scripts**: Read `setup-ios.sh` and `setup-android.sh` for details
4. **Clean and rebuild**: Often fixes mysterious issues

---

**Ready to start?** Run the setup scripts:

```bash
# iOS (after Xcode is installed)
./setup-ios.sh

# Android (after Android Studio finishes installing)
./setup-android.sh
```
