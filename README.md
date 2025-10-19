# Creator Mode

**Distraction-Free Social Browser** for mobile and desktop.

Post, DM, and manage your social profiles on Instagram, X, YouTube, TikTok, Facebook, and Snapchat—**without feeds, Reels, Shorts, or Spotlight**.

## Architecture

- **Mobile**: React Native (iOS/Android) with native WebView wrappers
- **Desktop**: Electron with Chromium-based policy enforcement
- **Backend**: NestJS + PostgreSQL for policy hosting, auth, and subscriptions
- **Policy Engine**: Shared TypeScript package compiling provider rules to platform-specific bundles

## Features

- ✅ Enforce strict allowlist policies (DMs, Compose, Profile, Notifications)
- ✅ Block infinite-scroll surfaces (feeds, Explore, Reels, Shorts, Spotlight)
- ✅ Quick actions per provider
- ✅ Remote policy updates (signed & versioned)
- ✅ Cross-platform subscriptions ($9.99/month)
- ✅ Supabase Auth integration
- ✅ Optional OS-level shields (Screen Time, Focus Mode)

## Monorepo Structure

```
creator-mode/
├── apps/
│   ├── mobile/          # React Native (iOS/Android)
│   ├── desktop/         # Electron app
│   └── backend/         # NestJS backend
├── packages/
│   ├── policy-engine/   # Shared policy compiler
│   └── ui/              # Shared UI components
├── policy/
│   ├── policy.json      # Seed policy rules
│   └── signer/          # Policy signing CLI
└── .github/workflows/   # CI/CD
```

## Getting Started

```bash
# Install dependencies
npm install

# Run all apps in dev mode
npm run dev

# Run specific apps
npm run mobile    # React Native Metro
npm run desktop   # Electron
npm run backend   # NestJS

# Build for production
npm run build

# Sign policy
npm run policy:sign
```

### 📱 Test on Your Phone

We've integrated **Expo Dev Client** for easy phone testing:

```bash
cd apps/mobile
npm install

# Build dev client once (includes native modules)
npx expo run:ios    # or run:android

# Start dev server and scan QR code
npm start
```

See [apps/mobile/EXPO_SETUP.md](./apps/mobile/EXPO_SETUP.md) for detailed instructions.

## Compliance

- **Mobile subscriptions**: StoreKit2 (iOS) and Play Billing (Android)
- **Desktop subscriptions**: Stripe
- **Privacy**: No content scraping, no DM capture, minimal telemetry

## Disclaimer

Creator Mode is an independent browser overlay. Not affiliated with Instagram, X, YouTube, TikTok, Facebook, or Snapchat.

## License

Proprietary - All Rights Reserved
