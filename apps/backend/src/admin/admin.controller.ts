import { Controller, Get, Header } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  async overview() {
    const data = await this.adminService.getDashboardData();
    const completionRate =
      data.onboarding.total > 0 ? Math.round((data.onboarding.completed / data.onboarding.total) * 100) : 0;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unscroller Admin Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #0b1021; color: #e5e7eb; }
    header { padding: 20px 24px; border-bottom: 1px solid #1f2937; background: #0f172a; position: sticky; top: 0; z-index: 10; }
    h1 { margin: 0; font-size: 22px; }
    main { padding: 24px; max-width: 1200px; margin: 0 auto; }
    section { margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .card { background: linear-gradient(135deg, #111827, #0b162d); border: 1px solid #1f2937; border-radius: 12px; padding: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
    .card h3 { margin: 0 0 6px; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .card .value { font-size: 24px; font-weight: 700; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; background: #1f2937; color: #cbd5e1; border: 1px solid #273449; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 6px; font-size: 13px; }
    th { color: #cbd5e1; border-bottom: 1px solid #1f2937; }
    tr:nth-child(even) td { background: #0f172a; }
    tr:nth-child(odd) td { background: #0b1326; }
    .muted { color: #94a3b8; font-size: 12px; }
    .badge { padding: 2px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; }
    .badge.active { background: rgba(34,197,94,0.18); color: #34d399; }
    .badge.expired { background: rgba(239,68,68,0.18); color: #f87171; }
    .badge.cancelled { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .subtitle { margin: 8px 0 0; color: #94a3b8; }
  </style>
</head>
<body>
  <header>
    <h1>Unscroller Admin Dashboard</h1>
    <div class="subtitle">Payments, entitlements, onboarding overview</div>
  </header>
  <main>
    <section>
      <div class="grid">
        <div class="card">
          <h3>Active Subscriptions</h3>
          <div class="value">${data.subscriptions.activeCount}</div>
          <div class="muted">Expiring in 7 days: ${data.subscriptions.expiringSoon}</div>
        </div>
        <div class="card">
          <h3>Total Subscriptions</h3>
          <div class="value">${data.subscriptions.totalCount}</div>
          <div class="muted">Last 20 shown below</div>
        </div>
        <div class="card">
          <h3>Onboarding Completion</h3>
          <div class="value">${completionRate}%</div>
          <div class="muted">${data.onboarding.completed} of ${data.onboarding.total} completed</div>
        </div>
        <div class="card">
          <h3>Subscription Events</h3>
          <div class="value">${data.subscriptionEvents.total}</div>
          <div class="muted">Last 25 shown below</div>
        </div>
      </div>
    </section>

    <section>
      <h2>Recent Subscriptions</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Platform</th>
            <th>Status</th>
            <th>External ID</th>
            <th>Expires</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${data.subscriptions.recentSubscriptions
            .map(
              sub => `
                <tr>
                  <td>${sub.userId || '—'}</td>
                  <td><span class="pill">${sub.platform}</span></td>
                  <td><span class="badge ${sub.status}">${sub.status}</span></td>
                  <td class="muted">${sub.externalId || '—'}</td>
                  <td>${sub.expiresAt ? new Date(sub.expiresAt).toLocaleString() : '—'}</td>
                  <td class="muted">${sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Recent Entitlements</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Feature</th>
            <th>Expires</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${data.subscriptions.entitlements
            .map(
              ent => `
                <tr>
                  <td>${ent.userId || '—'}</td>
                  <td>${ent.feature}</td>
                  <td>${ent.expiresAt ? new Date(ent.expiresAt).toLocaleString() : '—'}</td>
                  <td class="muted">${ent.createdAt ? new Date(ent.createdAt).toLocaleString() : '—'}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Onboarding Progress (latest 25)</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Completed</th>
            <th>Completed At</th>
            <th>Current Screen</th>
          </tr>
        </thead>
        <tbody>
          ${data.onboarding.recent
            .map(
              row => `
                <tr>
                  <td>${row.user_id || '—'}</td>
                  <td>${row.is_completed ? 'Yes' : 'No'}</td>
                  <td>${row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}</td>
                  <td class="muted">${row.current_screen || '—'}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Subscription Events (latest 25)</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Event</th>
            <th>Plan</th>
            <th>Platform</th>
            <th>Price (cents)</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${data.subscriptionEvents.recent
            .map(
              evt => `
                <tr>
                  <td>${evt.user_id || '—'}</td>
                  <td>${evt.event_type || '—'}</td>
                  <td>${evt.plan_type || '—'}</td>
                  <td>${evt.payment_platform || '—'}</td>
                  <td>${evt.plan_price_cents ?? '—'}</td>
                  <td class="muted">${evt.created_at ? new Date(evt.created_at).toLocaleString() : '—'}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;

    return html;
  }
}
