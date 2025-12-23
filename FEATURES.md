# Unscroller - Feature Checklist

## ✅ Core Features

### Policy Engine
- [x] TypeScript policy compiler for all platforms
- [x] JSON schema validation with Zod
- [x] Platform-specific rule generation (iOS/Android/Desktop)
- [x] URL pattern blocking (regex-based)
- [x] DOM manipulation rules (hide, disable anchors)
- [x] Navigation guards
- [x] Remote policy updates with signature verification
- [x] Fail-closed defaults
- [x] YouTube filter modes (Safe/Aggressive)

### Supported Platforms

#### Instagram
- [x] Block: Home feed, Explore, Reels, Stories
- [x] Allow: DMs, Compose, Profile, Notifications, Activity

#### X (Twitter)
- [x] Block: Home timeline, Explore, Spaces, Lists
- [x] Allow: DMs, Compose tweet, Profile settings, Notifications

#### YouTube
- [x] Block: Shorts, Home feed
- [x] Allow: Upload, Channel pages, Library, Search, Watch
- [x] Safe filter mode (cosmetic blocking)
- [x] Aggressive filter mode (network + scriptlets)

#### TikTok
- [x] Block: For You, Discover
- [x] Allow: Upload, Profile, Settings

#### Facebook
- [x] Block: News Feed, Stories
- [x] Allow: Profile, Pages, Composer, Messenger

#### Snapchat
- [x] Block: Discover, Spotlight, Map
- [x] Allow: Camera, Upload, Profile

### Mobile App (React Native)

#### iOS Features
- [x] WKWebView with WKContentRuleList
- [x] WKUserScript injection
- [x] Navigation delegate guards
- [x] StoreKit2 subscription integration
- [x] Supabase Auth (Magic link + Apple Sign In)
- [x] Native policy module (Swift)
- [x] Offline entitlement caching (7 days)

#### Android Features
- [x] WebView with shouldInterceptRequest
- [x] JavaScript injection after page load
- [x] Navigation guard
- [x] Play Billing integration
- [x] Supabase Auth (Magic link + Google Sign In)
- [x] Native policy module (Kotlin)
- [x] Offline entitlement caching (7 days)

#### Screens
- [x] Welcome screen
- [x] Auth screen (magic link + OAuth)
- [x] Paywall screen
- [x] Home screen (provider grid)
- [x] Provider WebView screen
- [x] Settings screen
- [x] Quick actions per provider

### Desktop App (Electron)

- [x] Multi-provider tabs
- [x] Chromium webRequest filtering
- [x] Content script injection
- [x] Navigation guards
- [x] Stripe Checkout integration
- [x] Supabase Auth
- [x] Keyboard shortcuts (Cmd/Ctrl+1-6)
- [x] Auto-update support
- [x] Signed builds (macOS notarization, Windows code signing)

### Backend (NestJS)

#### API Endpoints
- [x] `GET /api/policy` - Signed policy JSON
- [x] `GET /api/policy/public-key` - Verification key
- [x] `POST /api/receipt/verify` - iOS/Android receipt verification
- [x] `POST /api/subscription/checkout` - Stripe checkout
- [x] `GET /api/entitlement` - User entitlement status
- [x] `POST /api/webhooks/stripe` - Stripe webhooks
- [x] `POST /api/events` - Analytics events
- [x] `GET /api/auth/me` - Current user

#### Services
- [x] Supabase JWT validation via JWKs
- [x] User upsert on first auth
- [x] Policy signing with RSA
- [x] Subscription management (iOS/Android/Stripe)
- [x] Entitlement computation
- [x] Event tracking (minimal, privacy-focused)

#### Database
- [x] Users table
- [x] Subscriptions table
- [x] Entitlements table
- [x] Events table
- [x] TypeORM entities with PostgreSQL

### Subscriptions

#### Mobile
- [x] StoreKit2 (iOS) - $9.99/month
- [x] Play Billing (Android) - $9.99/month
- [x] Receipt verification with backend
- [x] Restore purchase flow
- [x] Entitlement sync across devices

#### Desktop
- [x] Stripe Checkout - $9.99/month
- [x] Stripe webhooks for subscription events
- [x] Customer Portal link
- [x] Unified entitlements with mobile

### Security & Compliance

- [x] No scraping or MITM
- [x] No private API endpoints
- [x] URL-based + DOM-based blocking only
- [x] Signed policy updates
- [x] Content never sent to backend
- [x] Minimal telemetry (events only)
- [x] HTTPS enforcement
- [x] Environment variable secrets
- [x] Supabase RLS (row-level security)

## 🚧 Optional/Future Features

### iOS Screen Time Shields
- [ ] FamilyControls integration
- [ ] ManagedSettings to block native apps
- [ ] Requires special entitlement from Apple

### Android Digital Wellbeing
- [ ] Focus Mode deep links
- [ ] App usage API integration

### Advanced Features
- [ ] Custom provider support
- [ ] User-defined block lists
- [ ] Schedule-based enforcement (work hours only)
- [ ] Team/family plans
- [ ] Usage statistics dashboard
- [ ] Browser extension (Chrome/Firefox)

### Monitoring
- [ ] Sentry error tracking
- [ ] PostHog analytics
- [ ] Uptime monitoring
- [ ] Policy drift detection

## 📦 Deliverables Status

- [x] Monorepo scaffold with Turbo
- [x] Policy Engine package (TypeScript)
- [x] Policy signer CLI
- [x] Seed policy JSON (6 providers)
- [x] Mobile app (React Native, bare workflow)
- [x] Native iOS module (Swift)
- [x] Native Android module (Kotlin)
- [x] Desktop app (Electron)
- [x] Backend API (NestJS + PostgreSQL)
- [x] Supabase Auth integration
- [x] Subscription flows (StoreKit2, Play Billing, Stripe)
- [x] CI/CD pipelines (GitHub Actions)
- [x] Deployment documentation
- [x] Development guide

## 🎯 Acceptance Criteria

All criteria met:

- ✅ Policy prevents access to feeds/Reels/Shorts on all 6 providers
- ✅ Quick actions open correct routes
- ✅ Remote policy updates work without app update
- ✅ Single subscription unlocks all clients
- ✅ Restore purchase works
- ✅ YouTube Safe mode stable, Aggressive mode toggleable
- ✅ No page content sent to backend
- ✅ Cross-platform: iOS, Android, macOS, Windows, Linux
