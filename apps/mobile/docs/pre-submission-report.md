# Unscroller Pre-Submission Report

Prepared: {{DATE}}

## Summary

All compliance, UX, and moderation features are implemented. Remaining step is to execute the QA playbook and capture evidence. Once QA passes, proceed with final builds and store submission.

## Feature Readiness Checklist

| Area | Status | Notes |
| --- | --- | --- |
| Account Deletion | ✅ Implemented (Settings + backend purge) | Backend: `DELETE /api/account`; mobile flow alerts & signs out. |
| Sign in with Apple | ✅ Implemented | Available on Auth and Onboarding; uses Supabase ID token exchange. |
| Sign in with Google | ✅ Implemented | iOS + Android with Supabase hand-off. |
| Disclosures Screen | ✅ Implemented | Settings → Policy → “View Disclosures & Support”. |
| Privacy Policy Link | ✅ Wired | Settings/Disclosures open hosted policy URL (ensure content live). |
| UGC Moderation | ✅ Report & block tools + backend endpoints | Requires Supabase tables (`post_reports`, `user_blocks`). |
| Billing Flows | ✅ RevenueCat + Play Billing integration | QA needs sandbox verification. |
| Documentation | ✅ Compliance checklist, store asset plan, QA playbook | See `docs/` folder. |

## Outstanding Actions Before Submission

1. **Supabase Schema Check**  
   - Ensure `post_reports` and `user_blocks` tables exist with expected columns. Create migrations if missing.

2. **Privacy Policy & Support Hosting**  
   - Confirm `https://unscroller.app/privacy` and support/deletion pages match in-app links.

3. **Full QA Run**  
   - Follow `docs/qa-playbook.md`. Test on iOS simulator/device + Android test device. Record results.

4. **Store Assets**  
   - Capture screenshots/video after QA. Use guidance in `docs/store-listing-assets.md`.

5. **Versioning & Builds**  
   - Increment build numbers. Generate signed IPA/AAB. Validate via Apple Transporter & Play Console.

## Risk Log

| Risk | Mitigation |
| --- | --- |
| Policy backend unavailable | App falls back to embedded policy; warn user in QA to confirm refresh. |
| Supabase tables missing | Add SQL migrations prior to QA. |
| Play Billing account configuration | Run test purchase with licensed tester before final submission. |

## Deployment Readiness

- [ ] QA playbook executed, evidence archived.  
- [ ] Privacy/support links verified live.  
- [ ] Store assets approved internally.  
- [ ] Builds signed and validated.

Once all boxes checked, proceed with submission.
