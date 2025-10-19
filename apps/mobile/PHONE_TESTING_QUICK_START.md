# 📱 Phone Testing - Quick Reference

## First Time Setup (One-Time)

```bash
cd apps/mobile

# Install dependencies
npm install

# Build dev client with native modules
# iOS:
npx expo run:ios

# Android:
npx expo run:android
```

This builds the app with your custom native code (Swift/Kotlin) and installs it on your device.

## Daily Development

```bash
cd apps/mobile

# Start the dev server
npm start
```

Then:
1. **Scan QR code** with your phone's camera (iOS) or Expo Go app (Android)
2. App opens in the dev client
3. Edit code → **Instant refresh** on your phone!

## Quick Commands

```bash
# Start dev server
npm start

# Rebuild dev client (only when native code changes)
npx expo run:ios      # iOS
npx expo run:android  # Android

# Clear cache
npm start -- --clear

# Force LAN mode (if QR doesn't work)
npm start -- --lan
```

## Connecting Your Phone

### ✅ Easiest Method: QR Code

1. Run `npm start`
2. QR code appears in terminal
3. **iOS**: Open Camera app → scan QR
4. **Android**: Open Expo Go app → scan QR

**Important**: Phone and computer must be on **same WiFi network**

### ⚙️ Manual Connection (if QR fails)

1. Find your computer's IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Shows something like: inet 192.168.1.100
   ```

2. In the Expo dev server, it shows:
   ```
   Metro waiting on exp://192.168.1.100:8081
   ```

3. Enter this URL manually in Expo Go app

## Testing with Backend

If testing with the local backend:

1. **Start backend** on your computer:
   ```bash
   cd apps/backend
   npm run start:dev
   # Runs on http://localhost:3000
   ```

2. **Update mobile config** with your computer's IP:
   ```typescript
   // apps/mobile/src/services/policy.ts
   const BACKEND_URL = 'http://192.168.1.XXX:3000';
   ```

Replace `192.168.1.XXX` with your actual IP address.

## Troubleshooting

### "Unable to connect to Metro"
✅ **Fix**: Make sure phone and computer are on same WiFi
```bash
npm start -- --lan
```

### "Dev client not installed"
✅ **Fix**: Build the dev client first
```bash
npx expo run:ios  # or run:android
```

### Changes not showing
✅ **Fix**: Shake device → Reload

### Port 8081 already in use
✅ **Fix**: Kill existing Metro
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

## Development Tips

✅ **Shake device** to open dev menu  
✅ **Fast refresh** happens automatically on save  
✅ **Network inspector** available in dev menu  
✅ **React DevTools** connect automatically  
✅ **Hot reload** preserves app state  

## When to Rebuild Dev Client

Rebuild only when:
- ✅ Adding new native dependencies
- ✅ Modifying Swift/Kotlin code
- ✅ Updating Expo SDK version

Otherwise, just use `npm start` for daily development!

## Full Documentation

For complete instructions, see: [EXPO_SETUP.md](./EXPO_SETUP.md)

---

**Happy testing!** 📱✨
