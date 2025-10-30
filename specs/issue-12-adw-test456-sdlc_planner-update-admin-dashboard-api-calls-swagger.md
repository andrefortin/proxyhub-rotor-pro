# Feature: Update Admin Dashboard API Calls Using Swagger

## Metadata

issue_number: `12`
adw_id: `test456`
issue_json: `{\"title\": \"Update admin dashboard API calls using Swagger\", \"body\": \"refer to our new swagger api documentation and update all the api calls in our admin dashboard using the swagger docs as a reference\"}`

## Feature Description

This feature requires reviewing the Swagger/OpenAPI documentation at /api-docs to update all API calls in the admin dashboard components. Currently, calls in files like Dashboard.tsx, Providers.tsx, DashboardKPI.tsx, and UsageChart.tsx use endpoints such as /v1/proxies, /v1/providers, /v1/usage, with varying parameters (e.g., skip/take vs. page/limit). Updates will ensure alignment with Swagger schemas for methods, parameters (query, body), response formats, and tags like 'proxies', 'providers', 'usage', 'webhooks', improving consistency, error handling, and extensibility.

## User Story

As an admin user
I want the dashboard to make API calls that match the Swagger documentation
So that data is fetched accurately, paginated correctly, and the UI integrates seamlessly without errors.

## Problem Statement

API calls in the admin dashboard do not fully conform to the official Swagger documentation, leading to potential inconsistencies (e.g., Providers.tsx uses skip/take while README/Swagger likely uses page/limit), incomplete parameter usage (e.g., no filters or bbox in proxy fetches), and mismatched response handling. This can cause loading issues, incorrect data display, or missed features like authentication and validation.

## Solution Statement

Fetch and analyze the Swagger docs to identify correct endpoints, parameters (e.g., page, limit for pagination; pool, providerId, bbox for proxies), request bodies, and response schemas. Update fetch/axios calls in relevant components to use these specs, add proper headers/error handling, and adjust state management for paginated/filtered responses. Implement a shared API utility if patterns emerge for maintainability.

## Relevant Files

Use these files to implement the feature:

- `README.md` - Provides initial API overview and confirms Swagger at /api-docs; relevant for understanding base endpoints like /v1/proxies with pagination (?page=1&limit=20&pool=POOL&providerId=...&bbox=...).
- `apps/packages/api/src/main.ts` - Configures Swagger setup, confirming docs at /api-docs with tags like 'proxies', 'providers', 'usage', 'webhooks'.
- `apps/packages/admin/src/pages/Dashboard.tsx` - Contains fetch to /v1/proxies?page=1&limit=200; update to include filters/bbox per Swagger and handle items/total/page/limit response.
- `apps/packages/admin/src/pages/Providers.tsx` - Uses /v1/providers?skip=&take=; update to ?page=&limit=&search= as per docs, fix total calculation from response.
- `apps/packages/admin/src/DashboardKPI.tsx` - Fetches /v1/proxies/count, /v1/proxies/stats, /v1/pools/stats, /v1/usage/summary; verify/align parameters and responses with Swagger.
- `apps/packages/admin/src/UsageChart.tsx` - Commented fetch to /v1/usage/stats; implement and update to match Swagger schema for response codes and daily data.
- To understand E2E testing for UI updates: Read `.claude/commands/test_e2e.md` for test runner instructions and `.claude/commands/e2e/test_basic_query.md` for example test format with steps, verifications, and screenshots.

### New Files

- `.claude/commands/e2e/test_dashboard-api-updates.md` - E2E test file to validate updated API calls load data correctly in dashboard UI.

## Implementation Plan

### Phase 1: Foundation

Access Swagger docs at http://localhost:3000/api-docs to extract endpoint details. Create a shared API client utility in admin/src/lib/api.ts if not present, defining functions for each endpoint with Swagger params.

### Phase 2: Core Implementation

Update individual component fetches: replace non-standard params (skip/take) with page/limit, add optional filters, parse responses per schemas (e.g., {items: [], total: number, page: number, limit: number}).

### Phase 3: Integration

Integrate updated calls into UI logic, ensuring charts, tables, and KPIs render correctly. Add loading/error states and test with real API responses.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Research and Documentation Review

- Access Swagger at http://localhost:3000/api-docs and extract details for key endpoints: GET /v1/proxies (params: page, limit, pool, providerId, bbox; response: {items: Proxy[], total: number}), GET /v1/providers (params: page, limit, search), GET /v1/usage/summary, GET /v1/usage/stats, GET /v1/pools/stats, GET /v1/proxies/count/stats.
- Grep admin src for all fetch/API calls to catalog endpoints used in Dashboard, Providers, KPI, UsageChart.
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand E2E format, then create `.claude/commands/e2e/test_dashboard-api-updates.md` with steps: Navigate to dashboard, verify KPIs load (screenshot), check Providers table pagination works (screenshot), confirm UsageChart data (screenshot), verify no console errors on API calls.

### Update API Calls in Components

- In apps/packages/admin/src/lib/api.ts (create if needed), define functions like getProxies({page, limit, filters}), getProviders({page, limit, search}) using fetch with Swagger params and error handling.
- Update Dashboard.tsx: Replace direct fetch with api.getProxies({page:1, limit:200}); handle items/total in state.
- Update Providers.tsx: Change ?skip=&take= to ?page=&limit=&search=; use response.total for pagination math; update CRUD calls (POST/PATCH/DELETE /v1/providers) with body schemas from Swagger.
- Update DashboardKPI.tsx: Use api functions for /v1/proxies/count, /v1/proxies/stats, etc.; add filters if Swagger supports (e.g., date range for usage).
- Implement in UsageChart.tsx: Fetch /v1/usage/stats and set data; format for charts per response schema.

### UI and Testing Integration

- Add unit tests: Mock API responses in vitest/bun test for updated functions, assert on params and parsed data.
- Manually test: Run admin dev server, check network tab for correct API params/responses, verify UI renders without errors.
- Create E2E test file `.claude/commands/e2e/test_dashboard-api-updates.md` as planned, including verifications for data loading and screenshots.

### Final Validation

- Run validation commands to ensure no regressions, including E2E execution.

## Testing Strategy

### Unit Tests

- Test api.getProxies mocks Swagger response, asserts page/limit in URL, extracts items/total correctly.
- Test Providers CRUD: Mock POST body matches schema, handles success/error.
- Test UsageChart fetch: Parses stats into chart data arrays.

### Edge Cases

- Pagination with total > limit (e.g., page=2).
- Empty responses (total=0, items=[]).
- Invalid params (e.g., limit>100) - handle 400 errors.
- Network failure - show error UI.
- Auth-required endpoints if Swagger specifies (add headers).

## Acceptance Criteria

- All admin fetches use page/limit instead of skip/take; params match Swagger (e.g., search for providers, filters for proxies).
- Response handling parses {items, total, page, limit} correctly for lists.
- No console/network errors; data loads in <5s for default limits.
- CRUD operations in Providers use correct methods/bodies per Swagger.
- E2E test passes, validating dashboard KPIs, providers table, and usage charts.
- Frontend build succeeds with no type errors.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- Read http://localhost:3000/api-docs to confirm updated calls match extracted specs.
- cd apps/packages/admin && bun run build - Run frontend build to validate no errors.
- Open http://localhost:4173/dashboard in browser; check Network tab for /v1/proxies?page=1&limit=200, verify response parsed (no errors, data shows).
- Navigate to /providers; confirm ?page=1&limit=10&search= (if searched), pagination works based on total.
- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_dashboard-api-updates.md to validate dashboard API updates work (screenshots of KPIs, table, chart).
- cd apps/packages/api && uv run pytest - Run server tests to validate the feature works with zero regressions.
- cd apps/packages/admin && bun tsc --noEmit - Run frontend type check to validate the feature works with zero regressions.

## Notes

- If Swagger requires auth (e.g., Bearer token), add to headers; check env for API keys.
- Use Bun for any new deps (bun add axios if needed, but prefer native fetch).
- Future: Generate types from Swagger for better TS safety.
- Ensure docker-compose.dev.yml has API exposed on 3000 for docs access.