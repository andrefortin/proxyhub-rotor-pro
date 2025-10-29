# Feature: Refactor Dashboard to Industry Standard Content

## Metadata

issue_number: `2`
adw_id: `adw-002`
issue_json: `{\"title\": \"Refactor the dashboard page to include industry standard content\", \"body\": \"Refactor the existing admin dashboard in ProxyHub to incorporate industry-standard elements such as key performance indicators (KPIs), interactive charts for usage and proxy distribution, recent activity feeds, and a more professional layout. This will improve usability and provide better insights into system health, usage patterns, and provider performance.\"}`

## Feature Description

The feature refactors the ProxyHub admin dashboard to align with industry standards for analytics dashboards. It introduces structured sections including overview KPIs (e.g., total proxies, active providers, usage summary), visual charts (e.g., usage trends over time, proxy distribution by country/pool), a recent activity log (e.g., provider toggles, proxy imports), and enhanced navigation. This provides admins with at-a-glance insights, improving monitoring efficiency and decision-making for proxy management.

## User Story

As a ProxyHub admin user
I want to access a professional, industry-standard dashboard with KPIs, charts, and activity logs
So that I can quickly monitor system health, usage metrics, and recent changes without drilling into individual sections

## Problem Statement

The current dashboard in App.tsx consists of basic cards for map, pools, providers, orders, usage, and notifications, lacking structured analytics, visualizations, and a cohesive layout. This makes it harder for admins to gain quick insights into overall performance, trends, and activity, leading to inefficient monitoring and manual navigation.

## Solution Statement

Refactor App.tsx to adopt a standard dashboard layout with a header, sidebar navigation, KPI grid, chart sections using a library like Chart.js for visualizations, and an activity feed pulling from API endpoints. Fetch additional data for metrics (e.g., proxy counts, usage charts via new API summaries). Ensure responsive design and consistency with existing UI patterns (e.g., Card component). No major backend changes; extend existing API calls for aggregated data.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/admin/src/App.tsx` - Main admin component; refactor to include new dashboard sections, KPIs, charts, and activity log while preserving existing functionality like provider management and map.
- `apps/packages/admin/src/MapCard.tsx` - Existing map visualization; integrate as a dedicated section in the refactored dashboard without changes.
- `apps/packages/admin/src/index.css` - Global styles; extend for new dashboard elements like charts and KPIs to match industry standards (e.g., grid layouts, color schemes for metrics).
- `README.md` - Project overview; confirms admin UI at localhost:5173 and API at 8080 for data fetching; use for integration patterns.
- `.claude/commands/test_e2e.md` - E2E testing guide; read to understand how to create Playwright-based tests.
- `.claude/commands/e2e/test_basic_query.md` - Example E2E test; use as template for new dashboard test file.

### New Files

- `apps/packages/admin/src/DashboardKPI.tsx` - New component for KPI cards (e.g., total proxies, active sessions).
- `apps/packages/admin/src/UsageChart.tsx` - New component for rendering usage trends chart using Chart.js.
- `apps/packages/admin/src/ActivityLog.tsx` - New component for displaying recent events (e.g., provider toggles, imports).
- `.claude/commands/e2e/test_dashboard-refactor.md` - E2E test file for validating new dashboard elements (load page, verify KPIs/charts/activity, interact with sections).

## Implementation Plan

### Phase 1: Foundation

Research industry dashboard standards (e.g., KPI grids like Google Analytics, charts like Grafana) and existing patterns in App.tsx. Install Chart.js via `npm install chart.js react-chartjs-2` in admin package. Update API if needed for summary data (e.g., extend /v1/usage for time-series).

### Phase 2: Core Implementation

Refactor App.tsx layout: Add header with title/logo, sidebar for navigation (Map, Providers, etc.), main content with KPI row, charts section, and activity feed. Create new components for KPIs, charts (bar/line for usage/proxies by pool/country), and log (fetch recent events via new API or from existing usage/providers).

### Phase 3: Integration

Integrate new sections with existing data fetches (e.g., providers for KPI counts, usage for charts). Ensure responsive design with Tailwind/CSS. Add loading states and error handling. Validate no regressions in current features (map, provider toggle/add).

## Step by Step Tasks

### Task 1: Install Dependencies and Setup

- Run `cd apps/packages/admin && npm install chart.js react-chartjs-2` to add charting library.
- Update `apps/packages/admin/package.json` if needed for peer deps.
- Read existing App.tsx to identify data sources (e.g., providers, usage, pools).

### Task 2: Create New Components

- Create `apps/packages/admin/src/DashboardKPI.tsx` with grid of metric cards (e.g., Total Proxies: {proxies.length}, Active Providers: {providers.filter(p => p.active).length}, Daily Usage: {usage?.success || 0}).
- Create `apps/packages/admin/src/UsageChart.tsx` using Chart.js for bar chart of usage by pool/day.
- Create `apps/packages/admin/src/ActivityLog.tsx` as a list fetching recent events (mock or extend API for logs like "Provider toggled", "New proxy imported").
- Style components in `index.css` for industry look (e.g., blue/green accents for positive metrics, grids with shadows).

### Task 3: Refactor Dashboard Layout in App.tsx

- Restructure App.tsx: Wrap in <div className="dashboard-layout"> with header (<h1>ProxyHub Dashboard</h1>), sidebar (<nav> links to sections: Overview, Providers, Map, etc.), and main <main> with KPI grid, <UsageChart />, <ActivityLog />, existing cards (collapse non-essential to tabs if needed).
- Integrate data: Use existing useState/useEffect for providers/usage/pools; compute KPIs; pass to new components.
- Add fetch for activity data if new API needed (e.g., /v1/events?limit=10).

### Task 4: Enhance Data Fetching

- Extend useEffect in App.tsx to fetch additional summary data (e.g., total proxies count via new API /v1/proxies/count if exists, or compute from sample).
- Add error boundaries or toasts for failed fetches.

### Task 5: Create E2E Test

- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` for examples.
- Create `.claude/commands/e2e/test_dashboard-refactor.md` with steps: Load http://localhost:5173, verify header/title, check KPI values (e.g., >0 for totals), verify chart renders (no empty canvas), scroll to activity log and verify entries, take screenshots (overview, KPIs, chart, log), interact with navigation (click Providers, verify section loads).

### Task 6: Validation Commands

- Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npx prisma generate && npx prisma db push` - Sync schema if any DB changes (none expected).
- `docker compose -f docker-compose.dev.yml restart api` - Restart API for any data extensions.
- `cd apps/packages/admin && npm run build` - Build admin to validate no TS errors.
- `docker compose -f docker-compose.dev.yml up` - Start services and navigate to http://localhost:5173 (dashboard renders with new sections).
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_dashboard-refactor.md` to validate dashboard elements, KPIs, charts, and activity log with screenshots.
- `curl http://localhost:8080/v1/providers` - Verify existing API works.
- `docker compose -f docker-compose.dev.yml logs api | grep -i "error"` - Ensure no API errors during loads.
- `cd apps/packages/admin && npm run dev` - Run dev server, manually check responsive design and interactions.

## Testing Strategy

### Unit Tests

- Test DashboardKPI component: Render with mock data, verify metric displays (e.g., count active providers correctly).
- Test UsageChart: Mock chart data, ensure no render errors, verify bar heights for sample usage.
- Test ActivityLog: Mock events array, verify list renders without duplicates.

### Edge Cases

- Zero providers/proxies: KPIs show 0, charts empty but no crash, activity log shows "No recent activity".
- Large data: Charts handle 100+ pools without lag; activity log paginates if >20 items.
- No usage data: Fallback to "N/A" in KPIs/charts.
- Mobile view: Sidebar collapses, KPIs stack vertically.
- Failed API: Components show loading spinner or error message.

## Acceptance Criteria

- Dashboard loads with header, sidebar navigation, KPI grid (at least 4 metrics: total proxies, active providers, usage success/fail, avg score).
- Charts render: Usage bar chart by pool, proxy distribution pie by country (using existing geo data).
- Activity log shows 5-10 recent events (e.g., from usage events or mock).
- Existing features (map toggle, provider add/toggle) accessible via sidebar without regressions.
- Responsive: Works on desktop/mobile; build succeeds with no TS/lint errors.
- E2E test passes: Validates all new elements load and interact correctly with 4+ screenshots.

## Notes

- New library: Chart.js and react-chartjs-2 for visualizations (industry standard, lightweight).
- Future: Add real-time updates via WebSockets for activity log; integrate more APIs for advanced metrics (e.g., proxy uptime trends).
- Follow Tailwind for styling consistency; ensure accessibility (ARIA labels on charts).