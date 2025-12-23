# @unscroller/block-service

Scaffolding for the cross-platform **BlockService** TurboModule. The package exposes shared
TypeScript contracts along with the JS binding returned by
`TurboModuleRegistry.getEnforcing('BlockService')`.

## Current Surface

```ts
import { BlockService } from '@unscroller/block-service';

const result = await BlockService.authorize();
```

Refer to [`src/types.ts`](./src/types.ts) for the domain objects (`BlockSet`, `Task`, `Schedule`,
`AppLimit`, `UsageSample`, `UsageSummary`).

## Implemented Behaviors (Scaffold)

| Method | iOS | Android |
| --- | --- | --- |
| `authorize()` | Requests Screen Time authorization when FamilyControls is available. Otherwise reports `shieldsAvailable:false`. | Returns `{ authorized:false, shieldsAvailable:false }` placeholder. |
| `pickAppsForBlockSet()` | Not implemented (throws). | Not implemented (rejects). |
| `startTask()` | Not implemented. | Not implemented. |
| `stopTask()` | Not implemented. | Not implemented. |
| `addSchedule()` | Not implemented. | Not implemented. |
| `removeSchedule()` | Not implemented. | Not implemented. |
| `setAppLimits()` | Not implemented. | Not implemented. |
| `getUsage()` | Returns empty samples. | Returns empty samples. |
| `getUsageSummary()` | Returns empty summary between requested timestamps. | Returns empty summary. |
| `setShieldTheme()` | Not implemented. | Not implemented. |
| `allowOneMinute()` | Not implemented. | Not implemented. |

> **Note**: iOS scaffolding lives under `apps/mobile/ios/Unscroller/BlockServiceCoordinator.swift`
and forwards each method to a coordinator that currently returns placeholders. Android scaffolding
resides in `apps/mobile/android/app/src/main/java/com/unscroller/blockservice`.

## Required Native Work

### iOS
1. **Authorization & App Picker** — bind `FamilyActivityPicker` to gather
   `ApplicationToken`s and persist them in an app group container for extensions.
2. **Schedule Enforcement** — create DeviceActivity monitoring extension(s) to apply
   `ManagedSettingsStore().shield.applications` during active intervals.
3. **Task Timers** — maintain an in-app foreground service that unites active BlockSets with
   schedule shields, emitting telemetry on start/end.
4. **Per-App Limits** — configure `DeviceActivityEvent`s, handle
   `eventDidReachThreshold` in the monitor to shield individual apps.
5. **Usage Reporting** — implement `DeviceActivityReport` extension that aggregates total and per-app time.
6. **Custom Shield UI** — ManagedSettingsUI extension reading emoji/message overrides.

### Android
1. **Permission Onboarding** — guide through `UsageStats`, `Accessibility`, `Overlay` permissions.
2. **Foreground Detection** — AccessibilityService for `currentPackage`, fallback to `UsageStatsManager` polling.
3. **Blocking UX** — `BlockerActivity` (or overlay) presenting emoji/message and allow-one-minute affordance.
4. **Task Timers & Schedules** — `WorkManager` jobs for recurring schedules, foreground service for active timers.
5. **Usage Aggregation** — wrap `UsageStatsManager` queries to provide samples and summaries.
6. **Limits** — maintain per-app counters, enforce by launching `BlockerActivity` once threshold exceeded.

### Shared Concerns
- Persist BlockSets/Schedules/AppLimits in JS (e.g., Zustand/SQLite) and pass to native.
- Emit telemetry (`block_start`, `block_violation`, `block_end`, `limit_hit`, `usage_summary_view`).
- Provide graceful fallback on unsupported platforms (returning `shieldsAvailable:false`).

## Integration Hooks

1. **To-Do Task Timers**
   - Extend the To-Do detail screen to select a `BlockSet`.
   - On “Start Task”, invoke `BlockService.startTask({ id, title, durationMin, blockSetId })`.
   - Maintain active task state; send `stopTask` when user exits or timer expires.

2. **Schedules UI**
   - Build BlockSet manager allowing platform-specific app selection (`pickAppsForBlockSet`).
   - Offer weekly schedule editor to send `addSchedule` / `removeSchedule`.

3. **Usage Dashboard**
   - Query `getUsageSummary` for daily/weekly ranges to display total time and per-app charts.
   - Allow export by combining `getUsage` samples into CSV.

4. **Limits Configuration**
   - Per-app sliders stored as `AppLimit[]`, applied via `setAppLimits`.
   - Present bypass affordance by calling `allowOneMinute(appId)` when user taps “Allow 1 min”.

Keep iterating on the scaffolding until the native enforcement layers and UI wiring satisfy the
acceptance criteria.
