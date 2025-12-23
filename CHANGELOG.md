# Changelog

All notable changes to Unscroller will be documented in this file.

## [1.0.0] - 2025-10-15

### Added

#### Policy Engine
- TypeScript policy compiler for iOS, Android, and Desktop
- Zod schema validation for policy JSON
- Platform-specific rule generation
- URL pattern blocking with regex support
- DOM manipulation rules (hide selectors, disable anchors)
- Navigation guards for all platforms
- YouTube filter modes (Safe/Aggressive)
- Policy signing with RSA
- Remote policy updates

#### Mobile App (React Native)
- iOS app with WKWebView enforcement
- Android app with WebView enforcement
- Native modules for advanced policy control
- Supabase authentication (magic link + OAuth)
- StoreKit2 integration (iOS)
- Play Billing integration (Android)
- 6 provider screens with WebView enforcement
- Quick actions per provider
- Settings screen with policy version
- Offline entitlement caching (7 days)

#### Desktop App (Electron)
- Multi-provider tab interface
- Chromium webRequest filtering
- Content script injection
- Stripe Checkout integration
- Keyboard shortcuts
- Auto-update support
- Signed builds (macOS, Windows, Linux)

#### Backend (NestJS)
- Policy API with signature verification
- Supabase JWT validation
- User authentication and management
- Subscription management (iOS/Android/Stripe)
- Entitlement computation
- Receipt verification endpoints
- Stripe webhook handling
- Analytics event tracking
- PostgreSQL database with TypeORM

#### Provider Support
- Instagram (block feeds, Reels; allow DMs, compose)
- X/Twitter (block timeline, Explore; allow DMs, compose)
- YouTube (block Shorts, home; allow upload, watch)
- TikTok (block For You, Discover; allow upload)
- Facebook (block News Feed; allow Messenger, profile)
- Snapchat (block Spotlight, Discover; allow camera, upload)

#### Infrastructure
- Monorepo with Turbo
- GitHub Actions CI/CD
- TypeScript across all packages
- ESLint + Prettier configuration
- Comprehensive documentation

### Security
- No scraping or MITM attacks
- Content never sent to backend
- Minimal telemetry (event types only)
- Signed policy updates
- HTTPS enforcement
- Environment variable secrets

### Documentation
- README.md with project overview
- QUICKSTART.md for local development
- DEVELOPMENT.md for detailed dev guide
- DEPLOYMENT.md for production setup
- ARCHITECTURE.md for system design
- FEATURES.md for feature checklist
- CHANGELOG.md (this file)

## [Unreleased]

### Planned
- iOS Screen Time shields (requires Apple entitlement)
- Android Digital Wellbeing integration
- Browser extension (Chrome/Firefox)
- Custom provider support
- User-defined block lists
- Schedule-based enforcement
- Team/family plans
- Usage statistics dashboard
- Policy drift detection
- Sentry error tracking
