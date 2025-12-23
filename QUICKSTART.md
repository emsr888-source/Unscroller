# Unscroller - Quick Start

Get **Unscroller** running locally in 10 minutes.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** (or use Supabase's hosted DB)
- **Supabase account** (free tier works)
- **Xcode** (for iOS) or **Android Studio** (for Android)

## Step 1: Clone & Install

```bash
cd /Users/onalime/CascadeProjects/windsurf-project-2
npm install
```

This installs dependencies for all packages and apps.

## Step 2: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API**
3. Copy:
   - Project URL
   - Anon/Public Key
   - JWT Secret (from Service Role settings)

## Step 3: Configure Backend

```bash
cd apps/backend
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/unscroller
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_... # (optional for now)
```

## Step 4: Start Backend

```bash
cd apps/backend
npm run start:dev
```

Backend runs on **http://localhost:3000**

## Step 5: Configure Mobile

Edit `apps/mobile/src/services/supabase.ts`:
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

Edit `apps/mobile/src/services/policy.ts`:
```typescript
const BACKEND_URL = 'http://localhost:3000';
```

## Step 6: Start Mobile

### Option A: Test on Simulator/Emulator

#### iOS

```bash
cd apps/mobile
npm run ios
```

Opens in iOS Simulator.

#### Android

```bash
cd apps/mobile
npm run android
```

Opens in Android Emulator (make sure one is running).

### Option B: Test on Your Phone

1. Follow the simulator/emulator steps above to ensure Metro is running.
2. For iOS, open `apps/mobile/ios/CreatorMode.xcworkspace` in Xcode, select your device, and press **Run**.
3. For Android, connect a device with USB debugging enabled and run `npm run android`.
4. Metro will reload your device build automatically.

📱 **See [apps/mobile/PHONE_TESTING_QUICK_START.md](./apps/mobile/PHONE_TESTING_QUICK_START.md) for a focused device checklist.**
## Step 7: Start Desktop (Optional)

```bash
cd apps/desktop
npm run dev
```

Opens Electron app.

## Step 8: Test the Flow

1. **Sign In**: Use magic link (check terminal for link if email not configured)
2. **Skip Paywall**: For testing, you can temporarily bypass subscription check
3. **Open a Provider**: Click Instagram, X, YouTube, etc.
4. **Test Blocking**: Try to navigate to blocked routes:
   - Instagram: Try to go to `/` (home feed) → should block
   - YouTube: Try to go to `/shorts` → should block
   - X: Try to go to `/home` → should block

5. **Verify Quick Actions**: Click DM/Compose/Profile buttons

## Troubleshooting

### Backend won't start

- **Check PostgreSQL**: Make sure it's running
- **Database URL**: Verify connection string in `.env`
- **Port conflict**: Change PORT in `.env` if 3000 is taken

### Mobile won't load providers

- **CORS**: Backend allows all origins in dev mode
- **Network**: If using physical device, change `localhost` to your computer's IP
- **Policy**: Check backend logs for policy signing errors

### WebView blocking not working

- **iOS**: Check that content rules compiled (check Xcode console)
- **Android**: Check logcat for shouldInterceptRequest logs
- **Desktop**: Open DevTools and check console

### "Invalid JWT" error

- **JWT Secret**: Must match Supabase project
- **Token expired**: Sign in again
- **JWKS**: Backend fetches from Supabase on first request (may take a moment)

## Next Steps

- **Read**: [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed dev guide
- **Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- **Customize**: Edit `policy/policy.json` to modify rules
- **Subscribe**: Set up Stripe for desktop, RevenueCat for mobile

## Quick Commands

```bash
# Install all dependencies
npm install

# Start backend
npm run backend

# Start mobile Metro bundler
npm run mobile

# Start desktop
npm run desktop

# Build policy engine
cd packages/policy-engine && npm run build

# Sign policy
cd policy/signer && npm run sign

# Lint all
npm run lint

# Build all
npm run build
```

## Development Workflow

1. Make changes to code
2. Hot reload works for mobile (Metro) and backend (nodemon)
3. Desktop requires restart (or use `npm run dev` with watch mode)
4. Test on device/simulator
5. Commit and push

## Getting Help

- **Issues**: Check GitHub Issues
- **Docs**: Read ARCHITECTURE.md for deep dive
- **Policy**: See policy/policy.json for examples

---

**You're all set!** 🚀

Start building, testing, and customizing Unscroller.
