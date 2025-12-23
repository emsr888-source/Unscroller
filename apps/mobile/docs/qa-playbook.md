# Unscroller QA Playbook

Use this script before each App Store / Google Play submission. Capture evidence (screens or video) as you go.

## 1. Authentication & Onboarding

- [ ] Fresh install → Onboarding Welcome renders with Apple/Google buttons.  
- [ ] Sign in with Apple (iOS): complete flow, land on Home, verify profile email.  
- [ ] Sign in with Google (iOS & Android) succeeds via Supabase hand-off.  
- [ ] Email magic-link fallback triggers confirmation toast and email.  
- [ ] Skip onboarding path leads to profile setup without crash.

## 2. Billing & Subscription

- [ ] iOS Sandbox purchase (Creator Mode) unlocks premium features; RevenueCat shows entitlement active.  
- [ ] Restore purchases from Settings → Account Management.  
- [ ] Android internal test purchase using Play Billing; entitlement active.  
- [ ] Cancelled purchase path shows friendly error and leaves user in free tier.

## 3. Account Management & Deletion

- [ ] Settings → Delete Account removes Supabase session and data; app returns to onboarding.  
- [ ] Web deletion URL `https://unscroller.app/support/delete-account` accessible.  
- [ ] Attempt to access community after deletion → receive auth error (expected).

## 4. Filtering & Provider Controls

- [ ] Launch each provider shortcut (Instagram, X, YouTube, TikTok, Facebook) → productive surfaces load.  
- [ ] Manually navigate to blocked feed `/explore` or `/reels` → filtered/redirected.  
- [ ] Refresh policy (Settings → Policy → Refresh) updates version without crash.  
- [ ] Toggle Screen Time Shields / Focus Mode; ensure instructions and status update.

## 5. Community & Moderation

- [ ] Create a new community post; it appears in feed.  
- [ ] Report an existing post; success alert + Supabase `post_reports` entry visible.  
- [ ] Block a user; their posts disappear after refresh.  
- [ ] Attempt duplicate report → receives friendly error or deduped response.

## 6. Focus & Wellness Tools

- [ ] Start/finish a focus session; timer completes, XP/streak updates.  
- [ ] Open Panic Button and Meditation flows; verify media plays/animations run.  
- [ ] Journal + Calendar entries sync to Supabase (create, edit, delete).

## 7. Performance & Offline

- [ ] Cold start (no Metro) – splash → Home within acceptable time and no redboxes.  
- [ ] Offline mode: disable network, navigate core screens, ensure graceful fallbacks.  
- [ ] Restore network, pull to refresh feed and policy; data resyncs.

## 8. Regression Checks

- [ ] Navigation (bottom tabs, back stack) responsive with haptics.  
- [ ] Settings → Disclosures screen loads copy; Privacy/Deletion links open in browser.  
- [ ] XP/streak/challenges cards render without NaN or placeholder glitches.

## 9. Logging & Stability

- [ ] Confirm no console warnings/errors in release builds.  
- [ ] Optional: Verify crash/analytics tooling (Sentry/Crashlytics) receives session.

## 10. Submission Artifacts

- [ ] Capture final screenshots per store asset plan.  
- [ ] Update version/build numbers (Info.plist, build.gradle, app.json).  
- [ ] Produce signed IPA/AAB; run Apple Transporter and Play Console validation.  
- [ ] Archive QA notes + evidence with this checklist.
