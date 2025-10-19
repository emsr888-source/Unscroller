# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase project
- Stripe account (for desktop subscriptions)
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)

## Backend Deployment

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Database Setup

```bash
cd apps/backend
npm run build
# Run migrations (if using TypeORM migrations)
```

### 3. Deploy

Deploy to your provider:

- **Railway**: Connect repo, auto-deploy
- **Render**: Connect repo, add env vars
- **Fly.io**: `flyctl deploy`

## Mobile Deployment

### iOS

1. **Configure app in Xcode**
   ```bash
   cd apps/mobile/ios
   pod install
   open CreatorMode.xcworkspace
   ```

2. **Set up signing & capabilities**
   - Enable In-App Purchase
   - Add Supabase URL schemes

3. **TestFlight**
   ```bash
   cd apps/mobile
   npm run ios:build
   ```

4. **App Store submission**
   - Screenshots required
   - Privacy policy URL
   - App Store description (see README)

### Android

1. **Configure gradle**
   - Update `android/app/build.gradle`
   - Add signing config

2. **Build**
   ```bash
   cd apps/mobile
   npm run android:build
   ```

3. **Upload to Play Console**
   - Internal track first
   - Then production

## Desktop Deployment

### Mac

1. **Code signing**
   ```bash
   export APPLE_ID=your@email.com
   export APPLE_PASSWORD=app-specific-password
   ```

2. **Build & notarize**
   ```bash
   cd apps/desktop
   npm run package:mac
   ```

3. **Distribute**
   - Upload to website
   - Or use auto-update server

### Windows

1. **Code signing certificate**
   - Purchase from CA
   - Configure in electron-builder

2. **Build**
   ```bash
   npm run package:win
   ```

## Policy Updates

### Sign new policy

```bash
cd policy/signer
npm run build
npm run sign
```

### Deploy signed policy

Upload `signed-policy.json` to backend or CDN. Backend serves at `/api/policy`.

## Monitoring

- **Backend logs**: Check your hosting provider
- **Error tracking**: Add Sentry or similar
- **Analytics**: Events table in database

## Security Checklist

- [ ] Rotate Supabase keys
- [ ] Enable Stripe webhook signing
- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS on backend
- [ ] Review App Store/Play Store policies
- [ ] Test subscription flows end-to-end
