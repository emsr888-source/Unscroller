# Testing on Your Phone with Expo Dev Client

Since Creator Mode uses custom native modules (Swift/Kotlin), we use **Expo Dev Client** instead of standard Expo Go. This gives you the convenience of Expo with support for custom native code.

## Prerequisites

- **Expo CLI**: Installed globally
- **Physical device**: iOS or Android phone
- **Expo Go app**: Installed on your phone (from App Store/Play Store)

## Setup Steps

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Install Expo CLI Globally (if not already installed)

```bash
npm install -g expo-cli
# or
npm install -g @expo/cli
```

### 3. Build the Dev Client

You need to build the dev client **once** with your custom native code:

#### For iOS (requires Mac + Xcode)

```bash
# Install pods
npm run pods

# Build the dev client
npx expo run:ios
```

This will:
- Build the app with your native modules
- Install it on the simulator
- The dev client will be ready for fast refresh

#### For Android

```bash
# Build the dev client
npx expo run:android
```

Make sure you have:
- Android Studio installed
- Android emulator running OR physical device connected via USB

### 4. Start the Metro Bundler

```bash
npm start
```

This opens the Expo dev server.

### 5. Connect Your Phone

#### Option A: Scan QR Code (Easiest)

1. Run `npm start`
2. A QR code appears in the terminal
3. On **iOS**: Open Camera app, scan QR
4. On **Android**: Open Expo Go app, scan QR

**Note**: Your phone and computer must be on the **same WiFi network**

#### Option B: Direct Connection (if QR doesn't work)

1. Get your computer's local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. In Expo dev server, press `s` to toggle connection type to LAN

3. Manually enter URL in Expo Go:
   ```
   exp://192.168.1.XXX:8081
   ```

### 6. Test on Phone

Once connected:
- ✅ App opens in the dev client
- ✅ Fast refresh works (save file → instant reload)
- ✅ Shake device to open dev menu
- ✅ Test all features on real device

## Rebuilding the Dev Client

You only need to rebuild when:
- Adding new native dependencies
- Modifying native code (Swift/Kotlin)
- Updating Expo SDK

To rebuild:
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Testing Flow

1. **First time setup** (one-time):
   ```bash
   cd apps/mobile
   npm install
   npm run pods  # iOS only
   npx expo run:ios  # or run:android
   ```

2. **Daily development**:
   ```bash
   npm start
   # Scan QR code on phone
   # Edit code → auto-refreshes on phone
   ```

## Troubleshooting

### "Unable to connect to Metro"

**Fix**: Make sure computer and phone are on same WiFi
```bash
# Force LAN mode
npm start -- --lan
```

### "Dev client not installed"

**Fix**: You need to build the dev client first
```bash
npx expo run:ios  # or run:android
```

### Port already in use

**Fix**: Kill the existing Metro process
```bash
# Find and kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Then restart
npm start
```

### Supabase/Backend not reachable

**Fix**: Use your computer's local IP instead of `localhost`

Update `apps/mobile/src/services/policy.ts`:
```typescript
const BACKEND_URL = 'http://192.168.1.XXX:3000'; // Your computer's IP
```

### Changes not reflecting

1. Shake device → Reload
2. Or restart Metro: `npm start -- --reset-cache`

## Network Configuration for Testing

If testing with the backend:

1. **Start backend** on your computer:
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **Update mobile config** with your computer's IP:
   ```typescript
   // apps/mobile/src/services/policy.ts
   const BACKEND_URL = 'http://192.168.1.XXX:3000';
   
   // apps/mobile/src/services/supabase.ts
   const SUPABASE_URL = 'https://your-project.supabase.co';
   ```

3. **Allow local network access** (iOS only):
   - Settings → Privacy → Local Network → Creator Mode → ON

## Production Build vs Dev Client

- **Dev Client**: Fast development, instant refresh, includes dev tools
- **Production Build**: Optimized, standalone app for distribution

For production:
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Quick Reference

```bash
# Start dev server
npm start

# Build dev client (iOS)
npx expo run:ios

# Build dev client (Android)
npx expo run:android

# Clear cache and restart
npm start -- --reset-cache

# Open iOS simulator
npm run ios

# Open Android emulator
npm run android
```

## Advantages of Expo Dev Client

✅ Test on real device wirelessly  
✅ Fast refresh on save  
✅ Works with custom native modules  
✅ Easy debugging with React DevTools  
✅ Shake device for dev menu  
✅ Network inspector built-in  

---

**You're all set!** 📱 Scan the QR code and start testing Creator Mode on your phone!
