# E2E Test: Dashboard Refactor Validation

## Test Purpose
Validate the refactored ProxyHub admin dashboard includes industry-standard elements: header, sidebar navigation, KPI grid, usage charts, activity log, and ensures existing features (map, providers) remain accessible without regressions.

## Prerequisites
- Admin dev server running: `cd apps/packages/admin && npm run dev`
- API server running via `docker compose -f docker-compose.dev.yml up`
- Playwright installed: `npx playwright install`

## Test Steps

1. **Launch Browser & Navigate to Dashboard**
   - Launch Chromium browser in headed mode for visual verification
   - Navigate to `http://localhost:5173`
   - Verify page loads without errors (no red console errors)
   - Screenshot: Full page (`dashboard-full-load.png`)

2. **Verify Header and Sidebar Navigation**
   - Confirm header displays "ProxyHub Admin" title
   - Check sidebar has navigation items: Overview (active by default), Proxy Map, Providers, Orders, Usage, Notifications, Pools
   - Verify sidebar icons and labels render correctly
   - Click "Providers" link in sidebar
   - Confirm URL updates and Providers section loads (grid of providers or "No providers" message)
   - Click back to "Overview"
   - Screenshot: Sidebar navigation (`sidebar-nav.png`)

3. **Validate KPI Grid on Overview**
   - On Overview section, locate KPI cards (4 cards: Total Proxies, Active Providers, Success Rate, Avg Proxy Score)
   - Verify each KPI has icon, label, and numeric value (e.g., Total Proxies > 0 if data exists; else 0)
   - Check Success Rate shows % (e.g., 95.0%)
   - Hover over KPI cards to confirm shadow/hover effects
   - Screenshot: KPI grid (`kpi-grid.png`)

4. **Verify Usage Chart**
   - Locate Usage Trends chart section (bar chart with Success/Failures by pool)
   - Confirm chart renders without empty canvas (bars visible if data; fallback message if no data)
   - Check legend (Success/Failures) and title "Usage by Pool"
   - Verify responsive: resize window to mobile, confirm chart adapts
   - Screenshot: Usage chart (`usage-chart.png`)

5. **Check Activity Log**
   - Scroll to Recent Activity section
   - Verify log displays 5-10 events (e.g., "Provider toggled", "Imported proxies") or "No recent activity"
   - Each item should have icon badge, message, user, and timestamp
   - Hover item to confirm hover effect
   - Screenshot: Activity log (`activity-log.png`)

6. **Test Interactions and Existing Features**
   - From Overview, click "Load Sample" button under Proxy Map (if visible)
   - Confirm map updates (or logs no error)
   - Click "Providers" again, then "Add Provider" button
   - Verify modal opens with form fields (Name, Type dropdown, Config textarea, Logo URL)
   - Close modal without submitting
   - Navigate to "Usage" - confirm usage summary pre renders (JSON or chart)
   - Navigate to "Notifications" - verify method cards (Discord, Telegram, Webhook) with toggles and "Configure" buttons
   - Click "Send Test Notification" - confirm alert or network request (no crash)
   - Screenshot: Providers interaction (`providers-section.png`)

7. **Responsive Design Check**
   - Resize browser to mobile width (< 768px)
   - Confirm sidebar collapses or hides (or adapts)
   - KPIs stack vertically
   - Chart remains readable
   - Screenshot: Mobile view (`mobile-dashboard.png`)

8. **Error Handling**
   - Simulate API failure: Stop API container temporarily (`docker compose -f docker-compose.dev.yml stop api`)
   - Refresh page - verify graceful fallbacks (e.g., "No data" in KPIs/chart/log, no crashes)
   - Restart API and refresh - confirm data reloads
   - Screenshot: Error state (`error-state.png`)

## Expected Outcomes
- All sections load without JavaScript/TypeScript errors
- New elements (KPIs, chart, log) render with correct data or fallbacks
- Sidebar navigation switches sections smoothly (no regressions in providers/map)
- 7+ screenshots saved showing key states
- Test completes in < 2 minutes; no failed assertions

## Cleanup
- Close browser
- Ensure API container restarted if stopped

## Run Command
Use Playwright: `npx playwright test --project=admin-e2e test_dashboard-refactor.spec.ts`
(Implement as .spec.ts file based on this plan for automated execution)