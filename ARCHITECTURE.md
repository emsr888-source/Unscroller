# Unscroller - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unscroller Clients                     │
├─────────────┬─────────────┬────────────────┬───────────────┤
│   iOS App   │ Android App │  Desktop App   │  Future: Web  │
│             │             │   (Electron)   │               │
└─────────────┴─────────────┴────────────────┴───────────────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Backend API   │
                    │   (NestJS)     │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼─────┐      ┌─────▼──────┐     ┌─────▼─────┐
  │ Supabase  │      │ PostgreSQL │     │  Stripe   │
  │   Auth    │      │  Database  │     │  Billing  │
  └───────────┘      └────────────┘     └───────────┘
```

## Core Components

### 1. Policy Engine (Shared Package)

**Purpose**: Compile provider rules to platform-specific enforcement bundles

**Input**: `policy.json` (provider rules)

**Output**:
- **iOS**: WKContentRuleList JSON + WKUserScript
- **Android**: URL patterns + DOM injection script
- **Desktop**: webRequest filters + content script

**Key Files**:
- `packages/policy-engine/src/compiler.ts`
- `packages/policy-engine/src/compilers/ios-compiler.ts`
- `packages/policy-engine/src/compilers/android-compiler.ts`
- `packages/policy-engine/src/compilers/desktop-compiler.ts`

**Flow**:
```
policy.json → Parser (validate) → Compiler → Platform Rules
```

### 2. Mobile App (React Native)

**Tech Stack**:
- React Native 0.73 (bare workflow)
- TypeScript
- React Navigation
- Zustand (state)
- React Query (server state)
- react-native-webview
- RevenueCat / react-native-purchases

**Native Modules**:
- **iOS**: PolicyWebView (Swift) - installs WKContentRuleList
- **Android**: PolicyWebViewModule (Kotlin) - intercepts requests

**Screens**:
1. Welcome → Auth → Paywall → Home
2. Home: Grid of 6 providers + quick actions
3. ProviderWebView: Enforced WebView per provider
4. Settings: Subscription, policy version, shields

**WebView Enforcement** (iOS):
```swift
WKContentRuleListStore.default().compileContentRuleList(
  forIdentifier: "UnscrollerRules",
  encodedContentRuleList: rulesJSON
)
```

**WebView Enforcement** (Android):
```kotlin
override fun shouldInterceptRequest(
  view: WebView?,
  request: WebResourceRequest?
): WebResourceResponse? {
  if (isBlocked(request.url)) {
    return WebResourceResponse("text/plain", "utf-8", blockedStream)
  }
  return null
}
```

### 3. Desktop App (Electron)

**Tech Stack**:
- Electron 28
- TypeScript
- Vanilla JS renderer (or React if needed)
- electron-store (persistence)
- keytar (secure token storage)

**Process Architecture**:
- **Main Process**: Policy enforcement, auth, subscriptions
- **Renderer Process**: UI (provider grid, tabs)
- **Preload Script**: IPC bridge (contextBridge)

**WebView Enforcement**:
```typescript
session.webRequest.onBeforeRequest((details, callback) => {
  const isAllowed = policyManager.isNavigationAllowed(providerId, details.url);
  callback({ cancel: !isAllowed });
});

webview.executeJavaScript(contentScript);
```

**Tabs**:
- Each provider = separate `<webview>` tag with isolated session
- DOM manipulation via `executeJavaScript`

### 4. Backend (NestJS)

**Tech Stack**:
- NestJS 10
- TypeORM
- PostgreSQL
- Stripe SDK
- jose (JWT verification)

**Modules**:
1. **AuthModule**: Supabase JWT validation, user upsert
2. **PolicyModule**: Serve signed policy, public key
3. **SubscriptionModule**: Receipt verify, Stripe webhooks, entitlements
4. **AnalyticsModule**: Event tracking

**Database Schema**:
```sql
users:
  - id (uuid)
  - supabaseId (unique)
  - email
  - stripeCustomerId

subscriptions:
  - id (uuid)
  - userId (fk)
  - platform (ios|android|stripe)
  - status (active|expired|cancelled)
  - externalId
  - expiresAt

entitlements:
  - id (uuid)
  - userId (fk)
  - feature (creator_mode)
  - expiresAt

events:
  - id (uuid)
  - userId (nullable)
  - eventType
  - metadata (jsonb)
  - createdAt
```

**Auth Flow**:
```
1. Client sends Supabase JWT in Authorization header
2. Backend fetches JWKs from Supabase
3. Verifies JWT signature
4. Extracts `sub` (user ID) and `email`
5. Finds or creates user in local DB
6. Attaches user to request
```

### 5. Policy Signing

**Flow**:
```
1. Developer edits policy.json
2. Runs: cd policy/signer && npm run sign
3. Generates signed-policy.json with RSA signature
4. Uploads to backend or CDN
5. Backend serves at /api/policy
6. Clients verify signature before applying
```

**Why Signing?**
- Prevents tampering
- Allows remote updates without app store review
- Trust chain: only backend can sign policies

## Data Flow

### Policy Update Flow

```
1. Backend loads policy.json
2. Backend signs policy with private key
3. Client fetches /api/policy
4. Client verifies signature with public key
5. Client compiles to platform-specific rules
6. Client installs rules in WebView
7. Client caches policy locally
```

### Subscription Flow (Mobile)

```
1. User taps "Subscribe"
2. StoreKit2/Play Billing purchase
3. RevenueCat returns customerInfo
4. Client sends receipt to backend: POST /api/receipt/verify
5. Backend verifies with Apple/Google
6. Backend creates subscription + entitlement
7. Client caches entitlement (7-day offline grace)
```

### Subscription Flow (Desktop)

```
1. User clicks "Subscribe"
2. Backend creates Stripe Checkout session
3. User completes payment in browser
4. Stripe webhook → backend
5. Backend creates subscription + entitlement
6. Client polls /api/entitlement
```

### Navigation Guard Flow

```
1. User clicks link or navigates
2. WebView intercepts navigation
3. Platform checks: PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns)
4. If blocked:
   - Cancel navigation
   - Redirect to startURL
   - Show toast/alert
5. If allowed:
   - Proceed
   - Inject DOM script (hide elements)
```

## Security Model

### Threat Model

**What we prevent**:
- Accessing infinite-scroll feeds
- Accessing Explore/Discover pages
- Accessing Reels/Shorts/Spotlight
- Accidentally clicking blocked links

**What we DON'T prevent**:
- Determined users from using native apps
- Browser access outside our app
- VPN/proxy circumvention (not our goal)

**Why it works**:
- Users want to avoid distractions (self-control tool)
- Friction is the goal, not absolute blocking

### Privacy

**Data we collect**:
- Email (for auth)
- Subscription status
- Policy version loaded
- Event types (e.g., "provider_opened")

**Data we NEVER collect**:
- Page content
- DM messages
- User posts
- Browsing history details

**Compliance**:
- GDPR: Users can delete account
- CCPA: Users can request data export
- App Store: Privacy labels accurate

## Scaling Considerations

### Backend

- **Stateless**: All session state in Supabase
- **Caching**: Redis for policy (optional)
- **CDN**: Serve policy from CloudFlare
- **Database**: Connection pooling, read replicas

### Mobile

- **Offline-first**: 7-day entitlement cache
- **Background sync**: Fetch policy on foreground
- **Network efficiency**: Only fetch policy if ETag changed

### Desktop

- **Auto-update**: electron-updater
- **Incremental updates**: Only download changed files
- **Rollback**: Keep previous version

## Deployment Pipeline

```
Developer Push
      ↓
GitHub Actions CI
      ↓
┌─────┴─────┬─────────┬─────────┐
│           │         │         │
Backend   Mobile   Desktop   Policy
Deploy    Build     Build     Sign
  ↓         ↓         ↓         ↓
Railway  TestFlight Notarize  Upload
         Play Beta   Sign      to CDN
```

## Monitoring & Observability

- **Backend**: Logs → CloudWatch/Datadog
- **Errors**: Sentry (backend + mobile)
- **Metrics**: Subscription conversion, policy version distribution
- **Alerts**: Policy signature failures, backend downtime

## Future Improvements

1. **Browser Extension**: Chromium/Firefox addon
2. **Web Version**: PWA with similar enforcement
3. **Custom Providers**: User-defined rules
4. **Policy Editor**: GUI for non-devs
5. **Analytics Dashboard**: Subscription health, MAU/DAU
6. **Multi-tenancy**: Team/family plans
