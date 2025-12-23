# Unscroller Store Compliance Checklist

This document tracks the work required to satisfy App Store Review Guidelines and Google Play policies before submission.

## 1. iOS App Store Must-Haves

- **In-App Purchase**: Subscription flow currently bypasses purchases for testing; RevenueCat has been removed. Update this section when a new billing provider is integrated. @apps/mobile/src/screens/PaywallScreen.tsx#70-147
- **Account Deletion**: Users can delete accounts in-app from Settings; backend removes data and Supabase auth. @apps/mobile/src/screens/SettingsScreen.tsx#221-239 @apps/backend/src/account/account.controller.ts#1-16
- **Sign in with Apple**: Apple login available wherever social auth appears. @apps/mobile/src/services/authProviders.ts#14-92 @apps/mobile/src/screens/AuthScreen.tsx#175-193
- **Native Value**: Focus timer, analytics, filtering, and other native screens already implemented (see Home, Progress, etc.).
- **WebView Filtering**: Ensure WKContentRuleList-driven filtering remains active (`PolicyService` + embedded policy). @apps/mobile/src/services/policy.ts#1-140
- **No External Purchase Links**: Verify paywall remains IAP-only.

## 2. Google Play Requirements

- **Play Billing**: RevenueCat integration removed; no Android billing provider is configured. Implement Play Billing before release.
- **Data Safety & Privacy Policy**: Need hosted privacy policy URL and matching answers in Play Console.
- **Account Deletion**: In-app deletion plus public web deletion page (linked in Settings) satisfied. @apps/mobile/src/screens/SettingsScreen.tsx#221-239
- **UGC Moderation**: Ensure report/block tooling and moderation process documented (Community features). @apps/backend/src/community/community.controller.ts#1-78
- **Native Functionality**: Confirm Android build includes filtering, shields, timers.

## 3. Shared Store Expectations

- **Positioning & Branding**: Maintain “independent browser” messaging in Settings footer and marketing assets.
- **Privacy Policy Access**: Link policy and support pages in-app (Settings + upcoming Help screen). @apps/mobile/src/screens/SettingsScreen.tsx#221-239
- **Tracking Consent**: Confirm ATT prompt and Android consent flow before enabling analytics/IDFA.
- **UGC Safety**: Publish community guidelines, reporting instructions, and moderation pipeline.
- **Brand Usage**: Use descriptive text/icons per platform brand guidelines.

## 4. Remaining Action Items

1. **Disclosures & Help Screen**
   - Add dedicated in-app section covering filtering behavior, provider controls, billing, data usage, and contact/support links.
2. **Privacy Policy URL**
   - Host updated policy (include auth, analytics, deletion, third-party SDKs) and surface prominently in Settings + onboarding.
3. **Google Play Data Safety Form**
   - Draft accurate entries covering data collection, sharing, retention, and security.
4. **UGC Moderation Enhancements**
   - Expose report/block UI client-side; ensure backend moderation queue ready.
5. **Pre-Submission QA Scripts**
   - Document scenarios: purchase/restore (iOS & Android), offline flows, deletion, social auth, filtering checks, community moderation.
6. **Store Listing Assets**
   - Capture screenshots highlighting focus timer, insights, provider launcher, shields; produce promo copy with pricing/legal language.

## 5. Pre-Submission QA Checklist

| Scenario | Notes |
| --- | --- |
| Purchase + Restore (iOS) | Test with Sandbox; verify post-backend entitlement. |
| Purchase + Restore (Android) | Test with Play test user; confirm entitlement sync. |
| Account Deletion | Delete user, ensure Supabase + backend purge and sign-out. |
| Social Sign-In | Apple (iOS) + Google (iOS/Android) login, fallback to email. |
| Filtering | Validate WKContentRuleList/web rules block feeds & allow productive paths. |
| Community Moderation | Report/block user; confirm backend handles entries. |
| Offline Grace | Launch without network; ensure helpful messaging. |

Keep this checklist updated as tasks complete. Once all items above are addressed, mark this document as ready and proceed to final QA + submission.
