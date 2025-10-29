# Feature: Add Admin Page Routes and Sidebar Navigation

## Metadata

issue_number: `3`
adw_id: `adw-003`
issue_json: `{\"title\": \"Create page routes for the admin portal for the proxies, providers, etc... and include them in the side nav bar\", \"body\": \"Implement client-side routing in the ProxyHub admin portal using React Router. Create dedicated pages for Proxies (list with filters/search), Providers (management panel), Map (interactive view), Orders (by provider), Usage (analytics), and Notifications (config). Add a persistent sidebar navigation bar with links to these routes, improving navigation and organization.\"}`

## Feature Description

The feature introduces client-side routing to the ProxyHub admin portal, splitting the monolithic App.tsx into modular pages for better scalability and user experience. A sidebar navigation will provide quick access to sections like Proxies (proxy list with search/filters), Providers (existing card view with add/toggle), Map (existing interactive map), Orders (order management), Usage (summary charts), and Notifications (config toggles). This modular approach enhances maintainability, allows focused data loading per page, and follows industry standards for admin portals (e.g., like Stripe Dashboard).

## User Story

As a ProxyHub admin user
I want to navigate between admin sections via a sidebar menu and dedicated page routes
So that I can efficiently access specific features like proxy management or provider settings without cluttered single-page overload

## Problem Statement

The current admin UI in App.tsx is a single, monolithic page cramming map, providers, orders, usage, and notifications into one view, leading to long scroll times, performance issues with all data loading at once, and poor navigation. There's no dedicated routing or sidebar, making it hard to focus on one area (e.g., proxies) without distractions from others.

## Solution Statement

Install React Router DOM for client-side routing. Refactor App.tsx to serve as the main layout with <BrowserRouter>, <Routes>, and <Route> elements for paths like /providers, /proxies, /map, /orders, /usage, /notifications. Create separate page components extracting logic from current App.tsx (e.g., ProvidersPage from provider section). Add a fixed sidebar <nav> with <Link> components for each route, plus a header. Preserve existing functionality; lazy-load pages with React.lazy for performance. No backend changes needed.

## Relevant Files

Use these files to implement the feature:

- `apps/packages/admin/src/App.tsx` - Main admin component; refactor to routing layout with sidebar and outlet for pages; extract sections to new pages.
- `apps/packages/admin/src/MapCard.tsx` - Existing map component; integrate into MapPage without changes.
- `apps/packages/admin/src/index.css` - Global styles; extend for sidebar (e.g., fixed positioning, hover effects) and page layouts.
- `README.md` - Project overview; confirms admin at localhost:5173; ensure routes don't break existing direct access.
- `.claude/commands/test_e2e.md` - E2E testing guide; read to understand Playwright setup for route navigation.
- `.claude/commands/e2e/test_basic_query.md` - Example E2E test; use as template for navigation validation.

### New Files

- `apps/packages/admin/src/pages/ProxiesPage.tsx` - Dedicated page for proxy listing with search, filters (by pool/provider/status), and table view.
- `apps/packages/admin/src/pages/ProvidersPage.tsx` - Extracted provider management with cards, add modal, and toggle.
- `apps/packages/admin/src/pages/MapPage.tsx` - Dedicated interactive map view with load sample/all buttons.
- `apps/packages/admin/src/pages/OrdersPage.tsx` - Page for viewing/managing orders across providers, with rotate/delete actions.
- `apps/packages/admin/src/pages/UsagePage.tsx` - Usage summary with KPIs and potential charts.
- `apps/packages/admin/src/pages/NotificationsPage.tsx` - Notification config toggles and test button.
- `.claude/commands/e2e/test_admin-routes.md` - E2E test file for validating route navigation, sidebar clicks, and page loads.

## Implementation Plan

### Phase 1: Foundation

Install React Router and research patterns (e.g., nested routes with layout). Extract existing sections from App.tsx to placeholder pages. Update vite.config.ts if needed for base path.

### Phase 2: Core Implementation

Create page components, implement routing in App.tsx with sidebar nav links. Add route guards or auth if future-needed (none now). Style sidebar for persistence across routes.

### Phase 3: Integration

Migrate data fetching to individual pages (e.g., providers fetch in ProvidersPage). Ensure sidebar highlights active route. Test seamless navigation without page reloads.

## Step by Step Tasks

### Task 1: Install Dependencies

- Run `cd apps/packages/admin && npm install react-router-dom` to add routing library.
- Update `apps/packages/admin/package.json` to include types if needed (`npm install --save-dev @types/react-router-dom`).

### Task 2: Create Page Components

- Create `apps/packages/admin/src/pages/ProxiesPage.tsx` with fetch for /v1/proxies, table/search/filters (reuse any existing list patterns).
- Create `apps/packages/admin/src/pages/ProvidersPage.tsx` extracting provider fetch, cards, add modal, toggle logic from current App.tsx.
- Create `apps/packages/admin/src/pages/MapPage.tsx` extracting map load/sample buttons and <MapCard />.
- Create `apps/packages/admin/src/pages/OrdersPage.tsx` extracting orders fetch/display/rotate/delete.
- Create `apps/packages/admin/src/pages/UsagePage.tsx` extracting usage summary.
- Create `apps/packages/admin/src/pages/NotificationsPage.tsx` extracting notification config and test.
- Style pages minimally in `index.css` for full-width content below sidebar.

### Task 3: Implement Routing and Sidebar in App.tsx

- Import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom'.
- Restructure App.tsx: Wrap in <BrowserRouter><Layout><Routes>...</Routes></Layout></BrowserRouter>.
- Create <Layout> component with fixed sidebar (<nav> with <ul><li><Link to="/providers">Providers</Link></li> etc. for all routes; use <NavLink> for active styling).
- Add header <header> with "ProxyHub Admin".
- Use <Outlet /> in layout for page content.
- Define <Routes>: <Route path="/" element={<ProvidersPage />} />, <Route path="/providers" element={<ProvidersPage />} />, <Route path="/proxies" element={<ProxiesPage />} />, etc.
- Migrate global states (if any) to context or props; keep fetches page-specific.

### Task 4: Enhance Navigation and Styling

- Add active route highlighting in sidebar (e.g., bg-blue-100 for current).
- Make sidebar collapsible on mobile (use state for toggle).
- Ensure pages load data on mount (useEffect in each page).

### Task 5: Create E2E Test

- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` for examples.
- Create `.claude/commands/e2e/test_admin-routes.md` with steps: Load http://localhost:5173, verify default /providers page, click sidebar "Proxies" link (verify URL changes to /proxies, page content updates), click "Map" (verify map loads), navigate back/forth, verify no 404s, take screenshots (sidebar, providers page, proxies page, map page), test add provider on providers route.

### Task 6: Validation Commands

- Execute every command to validate the feature works correctly with zero regressions.

- `cd apps/packages/api && npx prisma generate` - Ensure backend unchanged.
- `docker compose -f docker-compose.dev.yml restart api` - Restart API.
- `cd apps/packages/admin && npm run build` - Build admin to validate routing/TS.
- `docker compose -f docker-compose.dev.yml up` - Start services, navigate to http://localhost:5173 (default route loads).
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_admin-routes.md` to validate routing, sidebar navigation, and page loads with screenshots.
- `curl http://localhost:8080/v1/providers` - Verify APIs still work.
- `docker compose -f docker-compose.dev.yml logs api | grep -i "error"` - No new errors.
- Manually: Visit /proxies, /map, etc., confirm data loads, sidebar works.

## Testing Strategy

### Unit Tests

- Test sidebar links: Render <NavLink>, simulate clicks, verify URL/path updates.
- Test page components: e.g., ProvidersPage mounts and fetches data without errors.
- Test routing: Snapshot App.tsx routes structure.

### Edge Cases

- Invalid route: Redirect to / or show 404 page.
- Mobile: Sidebar collapses/hides, hamburger menu toggles.
- Concurrent navigation: No data loss between routes.
- Slow loads: Loading spinners on page transitions.
- Existing direct access: /providers loads correctly if bookmarked.

## Acceptance Criteria

- App.tsx uses React Router with defined routes for at least 6 pages (providers, proxies, map, orders, usage, notifications).
- Sidebar nav persistent with links to all routes, active highlighting, responsive on mobile.
- Each page extracts and functions independently (e.g., provider add/toggle works on /providers).
- Default route / redirects to /providers or dashboard overview.
- No regressions: All existing features (map interaction, API calls) work per route.
- Build succeeds; E2E test passes with navigation validations and 4+ screenshots.

## Notes

- New library: react-router-dom for routing (standard for React SPAs).
- Future: Add auth guards to routes; protected routes for sensitive sections.
- Ensure Vite handles client-side routing (no server config needed for SPA).