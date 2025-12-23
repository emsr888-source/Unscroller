# 📱 Phone Testing - Quick Reference

Use this when you want to run Unscroller on real hardware.

## First-Time Setup

1. **Install dependencies**
   ```bash
   cd apps/mobile
   npm install
   ```
2. **Prepare iOS (one time per device)**
   - Open `ios/CreatorMode.xcworkspace` in Xcode
   - Select your team and enable automatic signing
   - Plug in the device, trust the computer, and press **Run**
3. **Prepare Android (one time per device)**
   - Enable Developer Options → USB debugging
   - Connect the device via USB (or start an emulator)
   - Run `npm run android`

## Daily Development Loop

```bash
# Terminal 1 – Metro bundler
cd apps/mobile
npm run start

# Terminal 2 – build to device/emulator
npm run ios       # or npm run android
```

Edits in `apps/mobile/src` hot-reload automatically once Metro is running.

## Working on the Same Wi-Fi

If the device and computer share Wi-Fi but Metro cannot connect:

```bash
npm run start -- --host YOUR_IP_ADDRESS
```

You can find your IP with `ifconfig | grep "inet " | grep -v 127.0.0.1` (macOS/Linux).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Could not connect to Metro` | Ensure the device and computer share a network, try `npm run start -- --host <ip>` |
| Stuck on old bundle | Shake device → Reload, or run `npm run start -- --reset-cache` |
| Android build fails | Make sure Android Studio SDK/NDK versions match `android/build.gradle` |
| iOS build fails | Run `cd ios && pod install`, then clean build folder in Xcode |
| Port 8081 busy | `lsof -ti:8081 | xargs kill -9` |

## When to Rebuild

Rebuild the native app when:
- You add or remove a native module (e.g. WebView, MMKV)
- You change files in `ios/` or `android/`
- Xcode/Gradle warns about signing or package IDs

Otherwise, Metro reloads changes without a rebuild.

## More Detail

For a step-by-step walkthrough of the full mobile environment, see `MOBILE_SETUP_GUIDE.md`.

---

Happy testing! 📱✨
