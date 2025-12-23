# Development Guide

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This installs all dependencies for the monorepo (mobile, desktop, backend, packages).

### 2. Set Up Environment

#### Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env with your credentials
```

#### Mobile

```bash
cd apps/mobile
# Update src/services/supabase.ts with your Supabase credentials
# Update src/services/subscription.ts with RevenueCat keys
```

#### Desktop

```bash
cd apps/desktop
# Update src/main/policy-manager.ts with backend URL
```

### 3. Start Development Servers

#### Backend

```bash
npm run backend
# Runs on http://localhost:3000
```

#### Mobile

```bash
npm run mobile
# Opens Metro bundler
# Then run in iOS Simulator or Android emulator
```

#### Desktop

```bash
npm run desktop
# Opens Electron app
```

## Project Structure

```
unscroller/
├── apps/
│   ├── mobile/          # React Native app
│   ├── desktop/         # Electron app
│   └── backend/         # NestJS API
├── packages/
│   ├── policy-engine/   # Core policy compiler
│   └── ui/              # Shared UI components
├── policy/
│   ├── policy.json      # Provider rules
│   └── signer/          # Policy signing tool
```

## Key Concepts

### Policy Engine

The policy engine compiles `policy.json` into platform-specific rules:

- **iOS**: WKContentRuleList + WKUserScript
- **Android**: URL interceptors + JS injection
- **Desktop**: Chromium webRequest filters + content scripts

### Policy JSON Structure

```json
{
  "version": "2025.10.15",
  "providers": {
    "instagram": {
      "start": "...",        // Initial URL
      "allow": [],           // Allowed route patterns
      "block": [],           // Blocked URL/route patterns
      "dom": {               // DOM manipulation
        "hide": [],          // CSS selectors to hide
        "disableAnchorsTo": []
      },
      "quick": {             // Quick action URLs
        "dm": "...",
        "compose": "..."
      }
    }
  }
}
```

### Subscription Flow

1. User signs in via Supabase (magic link or OAuth)
2. Client checks entitlement via backend
3. If no subscription, show paywall
4. Purchase via StoreKit2/Play Billing/Stripe
5. Backend verifies receipt and creates entitlement
6. Client caches entitlement with 7-day offline grace period

### WebView Policy Enforcement

**iOS**:
- Install WKContentRuleList for URL blocking
- Inject WKUserScript for DOM hiding
- Navigation delegate checks allow patterns

**Android**:
- `shouldInterceptRequest` filters blocked URLs
- `evaluateJavascript` injects DOM script
- `shouldOverrideUrlLoading` checks navigation

**Desktop**:
- `session.webRequest.onBeforeRequest` blocks URLs
- `webview.executeJavaScript` injects content script
- Manual navigation guard before page load

## Testing

### Unit Tests

```bash
cd packages/policy-engine
npm test
```

### Integration Tests

Test subscription flows:
1. Create test user in Supabase
2. Use Stripe test mode
3. Verify entitlement creation

### Manual Testing

**Mobile**:
- TestFlight (iOS) / Internal track (Android)
- Test on real devices

**Desktop**:
- Build unsigned for testing: `npm run build`
- Test on all platforms (macOS, Windows, Linux)

## Common Tasks

### Add New Provider

1. Update `policy/policy.json` with provider rules
2. Add icon to mobile/desktop UI
3. Test blocking/allowing routes
4. Deploy policy update

### Update Policy

```bash
cd policy/signer
npm run sign
# Upload signed-policy.json to backend
```

Clients fetch on app foreground.

### Debug WebView Issues

**iOS**: Safari Web Inspector → connect to app
**Android**: Chrome DevTools → `chrome://inspect`
**Desktop**: DevTools built-in

## Style Guide

- **TypeScript**: Strict mode
- **React**: Functional components + hooks
- **State**: Zustand (mobile), Electron Store (desktop)
- **Naming**: camelCase for vars, PascalCase for components

## Troubleshooting

**WebView not loading?**
- Check CORS on backend
- Verify policy URL patterns
- Check console for errors

**Subscription not verifying?**
- Test with sandbox receipts
- Check backend logs
- Verify webhook signatures

**Policy not applying?**
- Check policy JSON validation
- Verify signature
- Clear app cache
