# Collaboration Features Verification Plan

Comprehensive checklist to validate push notifications, moderation tooling, and related flows for the Partnership Marketplace, Build-in-Public, and Direct Messaging features.

---

## 1. Environments & Tooling
- **Supabase project:** apply migrations through `apps/backend/src/db/migrations/009_collaboration.sql`.
- **Backend (NestJS) API:** `apps/backend` with `CONFIG.API_URL` pointing to staging.
- **Mobile app:** Expo client or native build from `apps/mobile` (QA accounts seeded via Supabase Auth).
- **Monitoring:** Supabase dashboard (tables + SQL editor), existing push delivery pipeline (notifications table feeding Expo/APNs/FCM workers), log drain (if configured) for API/server errors.

---

## 2. Push Notification Verification
| Scenario | Trigger | Expected notification (Supabase) | Mobile UX expectation | Notes |
| --- | --- | --- | --- | --- |
| Partnership application submitted | `POST /community/partnerships/:id/apply` | Row in `notifications` with `type='community'`, title `New partnership application`, `action_url=/partnerships/{id}` | Creator receives push (existing notification worker) + sees inbox badge | Service: `CommunityService.applyToPartnership()` creates notification via `createNotification()`.
| Partnership status update | `PUT /community/partnership-applications/:applicationId` | Applicant receives notification titled `Application {status}` | Applicant sees toast + DM-like push | Ensure accepted/declined messages reference listing headline.
| New build update | `POST /community/build-projects/:id/updates` | Followers receive `New build update` entries | Followers notified + Collaboration Hub feed shows update | `addBuildUpdate()` fans out using followers table.
| Build update liked/commented | `POST /community/build-updates/:id/like` / `POST /build-updates/:id/comments` | Author receives `New like...` / `New comment...` | Push + in-app alert | Validate like undo stops duplicate notifications (no entry on unlike).
| Direct message sent | `POST /social/messages/:partnerId` | Receiver gets `type='social'` entry via trigger `notify_new_message()` (migration 006) | Push badge + Messages thread shows unread | Already verified by existing pipeline; still confirm per new UI.

**How to test:**
1. Execute each REST call with two QA accounts (A/B). Use real tokens via mobile or curl.
2. Query `notifications` table after each action. Confirm `user_id`, `type`, `action_url`, and timestamps.
3. Inspect device logs: ensure push arrives (Expo dev tools or native). If running locally, confirm worker processes queue notifications (existing infra).

---

## 3. Moderation / Safety Verification
| Area | Endpoint/UI | Expectation | Validation steps |
| --- | --- | --- | --- |
| Report partnership listing | Mobile: long-press → "Report" (`reportPartnershipPost`) | Entry in `partnership_reports` with `status='pending'`, retains reporter & tenant IDs | Submit report, check Supabase table, ensure policy only exposes reporter’s submissions.
| Report build update | "Report" modal on update card (`reportBuildUpdate`) | Row in `build_update_reports`, referenced project/update | Confirm RLS enforces reporter_id = auth.uid().
| Block user (DM screen) | `POST /community/users/:targetUserId/block` | `user_blocks` entry (existing table) and DM UI auto-navigates away | Validate hidden threads in mobile (Messages screen filters blocked IDs via service call).
| Partnership application access control | Only listing owners can view `/partnerships/:postId/applications` and update statuses | Login as non-owner to ensure 403; Supabase RLS ensures data isolation.
| Build project visibility | Private projects only visible to owner (policy uses `visibility = 'public' OR auth.uid() = owner_id`) | Set project to private via direct SQL, confirm other users cannot fetch via `getBuildProjects`.

---

## 4. Suggested Manual Test Flow
1. **Setup:** Create two users (Creator + Collaborator). Creator posts partnership + build project.
2. **Applications:** Collaborator applies; Creator reviews and accepts. Observe notifications + UI transitions.
3. **Build feed:** Creator posts update; Collaborator follows project, likes/comments, reports test content.
4. **DMs:** Exchange messages, mark thread read, verify block flow.
5. **Reporting:** Submit reports for partnership/build content; confirm DB entries and that reporter-only access policy functions.
6. **Push audit:** For each action, confirm notifications table entry + push receipt on device.

---

## 5. Regression Checklist
- No duplicate notifications on repeated likes/comments (check `build_update_likes` unique constraint + triggers).
- Followers count stays accurate after follow/unfollow (trigger pair `trg_build_project_follow_*`).
- Applications count remains consistent when deleting submissions (trigger pair on partnership applications).
- RLS policies do not expose other tenants’ data (every table now includes `tenant_id` FK + default `current_tenant_id()`).

---

## 6. Outstanding Considerations
- **Notification delivery worker**: ensure it’s deployed/pointed at `notifications` table (out of scope for this repo but required for push). If disabled, run manual job to poll new rows.
- **Admin dashboard**: future work to surface `partnership_reports` / `build_update_reports` for moderation decisions.
- **Automated tests**: consider adding integration specs hitting `/community` + `/social` endpoints once backend testing harness is available.
