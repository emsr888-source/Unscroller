# 🚀 Unscroller - START HERE

## ✅ Setup Complete!

All dependencies have been installed and configured. Here's what you can do right now:

---

## 🎯 What Works Right Now

### 1️⃣ Backend API (Fully Ready!)

```bash
cd /Users/onalime/Unscroller/apps/backend

# Create environment file
cp .env.example .env

# Edit with your credentials (Supabase, Stripe, etc.)
# Then start the server:
npm run start:dev
```

**Runs on:** http://localhost:3000

### 2️⃣ Desktop App (Fully Ready!)

```bash
cd /Users/onalime/Unscroller/apps/desktop
npm run dev
```

**Opens immediately** - no additional setup needed!

### 3️⃣ Mobile App - Metro Bundler (Ready!)

```bash
cd /Users/onalime/Unscroller/apps/mobile
npm start
```

Then choose:
- Press **`w`** to open in browser (web preview)
- Press **`a`** for Android (needs Android Studio)
- Press **`i`** for iOS (needs Xcode)

---

## 📱 For Phone Testing

### Option A: iOS with Xcode (Full Features)

1. **Install Xcode** from Mac App Store (~15GB, 30-60 min)
2. **Switch to Xcode:**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```
3. **Install pods:**
   ```bash
   cd /Users/onalime/Unscroller/apps/mobile/ios
   pod install
   ```
4. **Run app:**
   ```bash
   cd /Users/onalime/Unscroller/apps/mobile
   npm run ios
   ```

**Pros:** Full native features, iOS Simulator  
**Cons:** Requires Xcode installation

### Option C: Android (Cross-Platform)

1. **Install Android Studio:** https://developer.android.com/studio
2. **Create AVD** (Android Virtual Device) in Android Studio
3. **Set environment:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. **Run app:**
   ```bash
   cd /Users/onalime/Unscroller/apps/mobile
   npm run android
   ```

**Pros:** Works on Mac/Windows/Linux  
**Cons:** Requires Android Studio setup

---

## 🏃 Quick Start (Right Now!)

### Desktop + Backend Together

```bash
# Terminal 1 - Backend
cd /Users/onalime/Unscroller/apps/backend
npm run start:dev

# Terminal 2 - Desktop
cd /Users/onalime/Unscroller/apps/desktop
npm run dev
```

### Mobile (Simulator or Emulator)

```bash
# Terminal 1 - Metro bundler
cd /Users/onalime/Unscroller/apps/mobile
npm run start

# Terminal 2 - launch platform build
npm run ios      # or npm run android
```

---

## 📋 Installation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Root Dependencies | ✅ Installed | Monorepo ready |
| Policy Engine | ✅ Built | TypeScript compiled |
| Backend | ✅ Ready | Needs .env file |
| Desktop | ✅ Ready | Run immediately |
| Mobile - Metro | ✅ Ready | Dev server works |
| Mobile - iOS | ⚠️ Needs Xcode | Install from App Store |
| Mobile - Android | ⚠️ Needs Android Studio | Configure emulator |
| CocoaPods | ✅ Installed | Via Homebrew |

---

## 🔧 Environment Configuration

### Backend (.env file)

```bash
cd /Users/onalime/Unscroller/apps/backend
cp .env.example .env
nano .env  # or use any text editor
```

Add your credentials:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/unscroller
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
```

### Mobile App

Edit these files with your credentials:

**`apps/mobile/src/services/supabase.ts`**
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

**`apps/mobile/src/services/policy.ts`**
```typescript
// For localhost testing
const BACKEND_URL = 'http://localhost:3000';

// For phone testing (use your computer's IP)
const BACKEND_URL = 'http://192.168.1.XXX:3000';
```

---

## 🎓 Learning the Codebase

### Project Structure
```
Unscroller/
├── apps/
│   ├── mobile/          # React Native (bare)
│   │   ├── src/
│   │   │   ├── screens/       # App screens
│   │   │   ├── services/      # API calls
│   │   │   ├── navigation/    # Routing
│   │   │   └── constants/     # Provider config
│   │   ├── ios/               # Native iOS
│   │   └── android/           # Native Android
│   │
│   ├── backend/         # NestJS API
│   │   └── src/
│   │       ├── auth/          # Authentication
│   │       ├── policy/        # Policy serving
│   │       ├── subscription/  # Payments
│   │       └── analytics/     # Events
│   │
│   └── desktop/         # Electron
│       └── src/
│           ├── main/          # Main process
│           ├── renderer/      # UI
│           └── preload/       # IPC bridge
│
├── packages/
│   └── policy-engine/   # Shared TypeScript
│       └── src/
│           ├── compilers/     # Platform-specific
│           └── parser.ts      # Policy validation
│
└── policy/
    ├── policy.json      # Provider rules
    └── signer/          # Signing tool
```

### Key Files

**Mobile:**
- `apps/mobile/App.tsx` - Root component
- `apps/mobile/src/screens/HomeScreen.tsx` - Provider grid
- `apps/mobile/src/screens/ProviderWebViewScreen.tsx` - Enforcement

**Backend:**
- `apps/backend/src/main.ts` - Bootstrap
- `apps/backend/src/policy/policy.service.ts` - Policy signing

**Desktop:**
- `apps/desktop/src/main/index.ts` - Electron main
- `apps/desktop/src/main/web-request-filter.ts` - URL blocking

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Port 8081 (Metro) already in use
```bash
lsof -ti:8081 | xargs kill -9
```

### Clear caches
```bash
cd /Users/onalime/Unscroller
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Rebuild policy engine
```bash
cd /Users/onalime/Unscroller/packages/policy-engine
npm run build
```

---

## 📚 Documentation

- **SETUP_STATUS.md** - Detailed setup report
- **SETUP_COMPLETE.md** - Installation summary
- **QUICKSTART.md** - Get running in 10 minutes
- **DEVELOPMENT.md** - Development guide
- **DEPLOYMENT.md** - Production deployment
- **ARCHITECTURE.md** - System design
- **FEATURES.md** - Feature checklist

---

## 🎯 Recommended First Steps

1. **Test Desktop App** (easiest):
   ```bash
   cd apps/desktop
   npm run dev
   ```

2. **Test Backend** (configure .env first):
   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env
   npm run start:dev
   ```

3. **Install Xcode** (if you want full iOS features):
   - Download from App Store
   - Follow Option B above

---

## ✅ Summary

**You're ready to develop!** 

✅ Backend & Desktop can run **right now**  
✅ Mobile dev server works **immediately**  
⚠️ iOS needs **Xcode** for simulator/device builds  
⚠️ Android needs **Android Studio** for emulator/device builds

**Choose your path:**
- **Quick Testing:** Run Metro + `npm run ios/android`
- **Full iOS:** Install Xcode
- **Full Android:** Install Android Studio
- **Desktop Only:** Start developing immediately!

---

**Happy Coding!** 🚀

For questions, see the docs folder or check specific guides:
- Mobile testing: `apps/mobile/PHONE_TESTING_QUICK_START.md`
- Status report: `SETUP_STATUS.md`
- Verification: Run `./verify-setup.sh`
