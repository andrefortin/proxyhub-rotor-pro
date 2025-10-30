# Feature: Proxy Management UI Page

## Metadata

issue_number: `13`
adw_id: `feature13`
issue_json: `{ "title": "Build Proxy Management Page", "body": "build out the proxy page to help us manage the proxies that have been uploade/added from the different providers. include features that will make it useful to manage or test. Make the user interface helpful for non-technical people. include micro-interations and other ui elements like hover text. must also support the dark/light themes. if we need and api calls to the backend-api keep track of them and submit the list as a /feature request to the system. make the ui sexy" }`

## Feature Description

The feature introduces a dedicated Proxy Management page in the admin UI to allow users to view, create, edit, delete, and test proxies imported from various providers. The page will feature a responsive table for listing proxies with filters and pagination, modals for CRUD operations, and built-in testing capabilities (e.g., connectivity checks via leasing simulation). To make it user-friendly for non-technical users, it includes intuitive tooltips (hover text), loading indicators, confirmation dialogs, and success/error notifications. Micro-interactions like smooth hovers, button animations, and optimistic updates enhance usability. The UI will fully support dark/light themes using existing Tailwind CSS variables. The design aims for a modern, sexy aesthetic with clean cards, badges, and icons. Any required backend API enhancements (e.g., proxy testing endpoint) will be tracked and submitted as a separate /feature request.

## User Story

As a non-technical admin user
I want to manage and test proxies through an intuitive web interface
So that I can easily monitor, organize, and verify proxies from different providers without needing command-line tools or technical expertise.

## Problem Statement

Currently, while backend APIs exist for proxy CRUD and listing, there is no dedicated UI page in the admin dashboard for managing proxies, similar to the Providers page. Users must rely on API calls or external tools, which is inefficient and inaccessible for non-technical team members. Additionally, proxy testing requires manual leasing and release, lacking a simple "test" button. The absence of a polished, theme-supporting UI hinders efficient proxy oversight.

## Solution Statement

Implement a new `/proxies` route in the admin UI, modeled after the Providers page, featuring a searchable, filterable table of proxies with actions for edit/delete/test. Use existing API endpoints for core CRUD (GET/POST/PATCH/DELETE /v1/proxies) and extend the API client for new features if needed. Integrate leasing (GET /v1/proxy) for testing by simulating a lease and checking response. Ensure UI elements like hovers (tooltips on proxy details), micro-interactions (e.g., fade-in on load, button ripples), and theme compatibility via Tailwind classes. For any gaps (e.g., dedicated test endpoint without leasing), note in Notes and plan a /feature submission for backend.

## Relevant Files

Use these files to implement the feature:

- `README.md`: Provides project overview, API endpoint details for proxies (e.g., GET /v1/proxies with filters like pool, providerId, bbox; pagination support), and admin UI access (http://localhost:4173). Relevant for understanding integration with providers and proxy listing patterns.
- `apps/packages/admin/src/pages/Providers.tsx`: Existing management page serving as a template for the Proxies page, including table structure, pagination, search, modals for CRUD, optimistic updates, and error handling. Adapt for proxy-specific fields (e.g., host/port/score instead of name/type).
- `apps/packages/admin/src/lib/api.ts`: API client with Fetch wrappers for providers (getProviders, createProvider, etc.); extend for proxies (add getProxies, createProxy, updateProxy, deleteProxy, issueLease for testing). Includes pagination and error handling patterns.
- `apps/packages/admin/src/App.tsx`: Root routing file using React Router; add route for `/proxies` pointing to new Proxies component. Wraps pages in Layout for theme/sidebar consistency.
- `apps/packages/admin/src/components/Layout.tsx`: Main layout with sidebar (already has /proxies link with Users icon) and header (theme toggle); ensures new page inherits navigation and theming.
- `apps/packages/admin/src/components/Sidebar.tsx`: Navigation menu; existing /proxies link can be activated without changes.
- `apps/packages/admin/src/components/ThemeToggle.tsx`: Handles dark/light mode toggle via class manipulation and localStorage; new page will automatically support via Tailwind dark: variants.
- `apps/packages/admin/src/components/ui/**`: Shadcn/UI primitives (e.g., card.tsx for table containers, switch.tsx for enable/disable toggles, button.tsx for actions with hover effects, badge.tsx for status/score indicators, tooltip.tsx for hover text on technical fields like ASN or meta).
- `apps/packages/admin/src/index.css`: Global Tailwind styles with CSS variables for themes (e.g., --background, --primary); add any custom micro-interaction styles (e.g., transitions for hovers).
- `apps/packages/admin/src/types.ts`: TypeScript interfaces; extend with Proxy type (e.g., { id: string, host: string, port: number, pool?: string, score: number, active: boolean, providerId?: string, ... }).
- `apps/packages/admin/src/utils.ts`: Utility functions like cn() for conditional classes (e.g., for status badges: cn('bg-green-100 dark:bg-green-900')).
- `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md`: Examples for creating E2E test files; read to understand structure for new test (e.g., navigate to /proxies, verify table loads, test CRUD actions with screenshots).

### New Files

- `apps/packages/admin/src/pages/Proxies.tsx`: Main page component for proxy management table, filters, and modals.
- `.claude/commands/e2e/test_proxy-management.md`: E2E test file to validate page functionality (e.g., list proxies, add/edit/delete, test button, theme toggle).

## Implementation Plan

### Phase 1: Foundation

Set up the basic page structure by adding the route and skeleton component, extending types and API client to fetch proxy data. Ensure theme compatibility by using existing Tailwind classes. Research confirms existing APIs cover listing/CRUD; stub testing via lease issuance.

### Phase 2: Core Implementation

Build the table with columns for proxy details (host:port, pool, provider, score badge, status switch, actions: edit/test/delete). Add search/filter dropdowns (pool, provider), pagination. Implement modals for create/edit with user-friendly forms (e.g., input for host/port, dropdown for pool/provider, tooltip on score: "Higher score means better reliability"). Integrate micro-interactions: hover tooltips via <Tooltip>, button hovers with scale/ring effects, loading skeletons on fetch.

### Phase 3: Integration

Connect to backend APIs for full CRUD. Add testing feature: "Test" button issues a lease (GET /v1/proxy?project=test&pool=proxy-pool), displays proxy string and success/failure. Handle errors with toasts. Ensure optimistic updates (e.g., toggle active before API confirm). Validate dark/light themes render correctly (e.g., test hover text visibility). If dedicated test API needed (e.g., POST /v1/proxies/:id/test for ping without lease), note for backend /feature.

## Step by Step Tasks

### Task 1: Research and Setup

- Read `apps/packages/admin/src/pages/Providers.tsx` to understand management page pattern (table, modals, API integration).
- Read `apps/packages/admin/src/lib/api.ts` to confirm/extend proxy endpoints (add getProxies, createProxy if missing; use existing for list with filters).
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand E2E test format.
- Extend `apps/packages/admin/src/types.ts` with Proxy interface based on backend DTOs (id, host, port, username/password (masked), protocol, pool, providerId, country/region/city, asn/org, score, failedCount, tags, meta, active, lastChecked).
- Add route in `apps/packages/admin/src/App.tsx`: Import Proxies and add <Route path="/proxies" element={<Proxies />} />.

### Task 2: Create E2E Test File

- Create `.claude/commands/e2e/test_proxy-management.md` with steps: Start admin UI (bun dev), navigate to /providers (verify loads), add a test provider if needed, import proxies (simulate via POST /v1/proxies), navigate to /proxies, verify table shows proxies (screenshot table with 1-2 rows), test search/filter (enter pool name, verify filtered), click "Add Proxy" modal, fill form and submit (screenshot success toast), edit a proxy (change pool, verify update), test "Test" button on a proxy (verify lease success message), toggle theme (light/dark, screenshot table in both), delete a proxy with confirm (verify removal). Include expected outcomes and screenshots for validation.

### Task 3: Build Core UI Structure

- Create `apps/packages/admin/src/pages/Proxies.tsx` skeleton: Use useState for proxies, page state; fetch on mount via getProxies({page: 1, limit: 10}).
- Add search input and filter dropdowns (pool: select from options, provider: select from fetched providers via getProviders).
- Implement table with columns: Checkbox for bulk (future), Host:Port (link to details), Pool (badge), Provider (avatar/logo if available), Geo (country/city tooltip on hover), Score (progress bar or badge with tooltip: "Reliability score (0-100)"), Status (switch for active/disabled, optimistic update via PATCH /v1/proxies/:id {active: bool}), Actions (Edit, Test, Delete buttons with icons).
- Add pagination controls (Previous/Next, page info) integrated with API.

### Task 4: Implement CRUD Modals

- Add "Add Proxy" button (top-right, primary with Plus icon, hover scale).
- Create modal for create/edit: Fields - Host (input), Port (number), Username/Password (masked inputs, optional), Protocol (select: http/socks4/socks5), Pool (select or input), Provider (dropdown from getProviders), Geo (optional inputs or auto-filled), Tags (multi-select chips), Active (switch). Use tooltips (e.g., on Provider: "Select source provider for organization"). JSON textarea for meta if advanced.
- Handle form submission: POST /v1/proxies for create, PATCH for edit; refetch list on success with toast ("Proxy added successfully").
- Add delete confirm dialog: "Delete this proxy? This is irreversible." with Trash icon, red button.

### Task 5: Add Testing and Micro-Interactions

- Implement "Test" button: On click, call issueLease({project: 'admin-test', pool: proxy.pool}) to get proxy string; simulate request (e.g., fetch via proxy if possible, or just verify lease success), show modal with "Test Results: Proxy string, Status: OK/Failed, Latency: N/A". Update score/failedCount if failed (via releaseLease).
- Add micro-interactions: Table row hover (bg-accent, cursor-pointer), button hovers (transform scale-105 transition-200), loading skeletons (animated gray bars during fetch), success/error toasts (using existing pattern or simple alert).
- Hover text: Use <Tooltip> from ui/ for fields like ASN ("Autonomous System Number"), Meta (expand on hover), Score (explanation).
- Ensure sexy UI: Rounded cards for table container, gradient accents on buttons if fits theme, icons everywhere (Globe for geo, Zap for test), responsive grid for filters.

### Task 6: Theme and Polish

- Test dark/light: Toggle theme, verify colors (e.g., table rows dark:bg-muted, tooltips readable).
- Add bulk actions if time: Select all, delete selected (with confirm).
- Error handling: Empty state ("No proxies found. Add one above."), API errors as red banners.
- Run `cd apps/packages/admin && bun tsc --noEmit` to check types.

### Task 7: Validation

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_proxy-management.md` to validate functionality works.
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend type check to validate no errors.
- `cd apps/packages/admin && bun run build` - Run frontend build to validate compiles without errors.
- Manually test: Start UI (bun dev), navigate /proxies, perform CRUD/test, toggle theme, check hovers/tooltips. Verify no regressions in Providers/Dashboard.
- If new APIs needed (e.g., POST /v1/proxies/:id/test for dedicated connectivity test without full lease), submit /feature request: "Add proxy test endpoint for admin UI to ping proxy and update score without issuing full lease."

## Testing Strategy

### Unit Tests

- Test Proxies component: Render with mock data (verify table rows render), simulate API calls (fetch mocks for getProxies, verify pagination updates), modal open/close/form submit (jest/enzyme or React Testing Library).
- Test API functions: Mock Fetch for getProxies (verify query params like ?pool= &page=1), createProxy (POST body validation).
- Test utils: cn() with dark classes.
- Add to existing `apps/packages/admin/src/**/*.test.tsx` pattern.

### Edge Cases

- Empty proxy list (show placeholder: "Get started by adding a proxy").
- Large lists (pagination >100 items, bbox filter for geo-heavy data).
- Invalid inputs (e.g., invalid port in form, API 400 on create).
- Failed tests (e.g., lease unavailable, show "Proxy not responding" with retry).
- Theme switch mid-interaction (e.g., modal open in light, toggle to dark).
- Network errors (offline mode, retry buttons).
- Bulk select with 0/all selected.
- Masked password visibility toggle.

## Acceptance Criteria

- Page accessible at /proxies via sidebar link, renders table with fetched proxies (or empty state).
- Search/filter/pagination work: Typing in search updates list client-side or via API, filters narrow results (e.g., by pool), pages load 10 items.
- CRUD: Add new proxy via modal (form validates, submits to API, refetches list), edit updates fields (e.g., change pool), delete removes with confirm and no undo.
- Test button: Issues lease for selected proxy, shows results (success with proxy string, failure with error), updates UI if score changes.
- UI/UX: Hover tooltips on technical fields (e.g., "Score: Based on recent usage success"), micro-interactions smooth (no jank), sexy design (consistent with Providers: cards, badges, icons).
- Themes: Full support – table, modals, buttons adapt to dark/light without contrast issues.
- Non-technical friendly: Clear labels (e.g., "Host Address" instead of raw "host"), success messages, no jargon without tooltips.
- No regressions: Providers/Dashboard unchanged, build/types pass.
- E2E test created and validates core flows (CRUD, test, theme) with screenshots.
- Needed APIs tracked: If dedicated test endpoint required, /feature submitted.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_proxy-management.md` to validate this functionality works.
- `cd apps/packages/admin && bun tsc --noEmit` - Run frontend tests to validate the feature works with zero regressions
- `cd apps/packages/admin && bun run build` - Run frontend build to validate the feature works with zero regressions

## Notes

- Backend APIs mostly sufficient (list/create/update/delete via /v1/proxies; lease for testing via /v1/proxy). For enhanced testing (e.g., actual HTTP ping through proxy), submit /feature: "Implement POST /v1/proxies/:id/test endpoint to check connectivity (e.g., fetch test URL via proxy) and auto-update score/failedCount. Return { success: bool, latencyMs: number, error?: string }."
- No new libraries needed; reuse existing (Tailwind for sexy UI, Lucide for icons, shadcn for components).
- For geo visualization, consider future integration with existing map (Leaflet in admin), but out of scope – keep table-focused.
- Ensure passwords masked in table/modals; use type="password" with eye toggle if editing.
- Future: Bulk import from file (CSV upload), export list (CSV/JSON download) – track as enhancements.