# Feature: Update Admin Panel Proxy API Calls

## Metadata

issue_number: `11`
adw_id: `test123`
issue_json: `{\"title\": \"Update API calls to proxy API in admin panel\", \"body\": \"Update the API calls to the proxy API in our admin panel to use the API docs as reference\"}`

## Feature Description

This feature involves reviewing and updating the API calls made from the admin panel to the proxy endpoints (/v1/proxies) to ensure they align with the documented API specifications in the README.md. Currently, calls like /v1/proxies/sample, /v1/proxies/count, and /v1/proxies/stats are used, but they may need adjustments to support pagination, filters, and other documented features for better consistency and functionality.

## User Story

As a admin user
I want to make API calls from the admin panel that match the documented proxy API
So that the interface behaves predictably and leverages full API capabilities like pagination and filtering.

## Problem Statement

The existing API calls in the admin panel's frontend (e.g., in Dashboard.tsx and DashboardKPI.tsx) do not fully utilize or align with the documented proxy API features, such as pagination (?page=1&limit=20), filtering by pool or provider, and bounding box for maps. This can lead to inefficient data loading, lack of scalability for large datasets, and inconsistency with backend expectations.

## Solution Statement

Review all proxy API calls in the admin panel source files, update them to use documented endpoints and parameters (e.g., add pagination to list fetches, ensure proper error handling), and test for seamless integration. This will involve modifying fetch requests in relevant components to include query params as per API docs and possibly updating state management to handle paginated responses.

## Relevant Files

Use these files to implement the feature:

- `README.md` - Contains the API documentation for proxy endpoints, including pagination, filtering, and sample usage, which serves as the reference for updates.
- `apps/packages/admin/src/pages/Dashboard.tsx` - Contains fetch calls to /v1/proxies/sample that need updating to use documented list endpoint with pagination.
- `apps/packages/admin/src/DashboardKPI.tsx` - Includes calls to /v1/proxies/count and /v1/proxies/stats; verify alignment with docs and add any necessary params.
- `apps/packages/admin/src/pages/Providers.tsx` - May involve related proxy calls if providers interact with proxies; check for updates.
- `apps/packages/admin/src/components/Sidebar.tsx` - Potential navigation or data fetches related to proxies.

### New Files

No new files required for this update.

## Implementation Plan

### Phase 1: Foundation

Review current API calls and compare against README.md documentation to identify discrepancies. Establish any shared utilities for API requests if not already present.

### Phase 2: Core Implementation

Update individual fetch calls in Dashboard and KPI components to include pagination and filters as per docs. Handle responses with items, total, page, limit structure.

### Phase 3: Integration

Integrate updated calls into the UI components, ensuring map clustering and KPI displays work with new response formats. Test end-to-end data flow.

## Step by Step Tasks

### Research and Analysis

- Read README.md to fully understand proxy API endpoints, parameters (e.g., ?page=1&limit=20&pool=POOL&providerId=...&bbox=minLon,minLat,maxLon,maxLat), and response formats.
- Use Grep to search for all instances of '/v1/proxies' in apps/packages/admin/src to catalog existing calls.
- Analyze Dashboard.tsx for /v1/proxies/sample call and plan replacement with paginated GET /v1/proxies.
- Analyze DashboardKPI.tsx for /v1/proxies/count and /v1/proxies/stats calls; verify if these match docs or need params.

### Update API Calls

- In Dashboard.tsx, replace fetch to /v1/proxies/sample with fetch to /v1/proxies?page=1&limit=200 (for map sample) or implement proper pagination.
- Update state management in Dashboard.tsx to handle paginated response (items array).
- In DashboardKPI.tsx, ensure /v1/proxies/count includes any necessary filters if applicable per docs.
- Add error handling to all updated fetch calls (e.g., check res.ok and handle errors).

### UI Integration and Testing

- Update map component in Dashboard.tsx to use paginated proxy data with clustering.
- Add pagination controls if needed for proxy lists in admin panel.
- Write unit tests for updated fetch functions, mocking API responses with pagination structure.
- Run frontend build and test UI interactions manually.

### Final Validation

- Run validation commands to ensure no regressions.
- Test API calls in browser dev tools to confirm they match documented params and responses.

## Testing Strategy

### Unit Tests

- Test updated fetch functions in Dashboard.tsx to return paginated data structure.
- Mock /v1/proxies calls in DashboardKPI.tsx and assert on count/stats values.
- Integration test for map rendering with proxy data including bbox filters.

### Edge Cases

- Empty proxy list (total=0).
- Large datasets requiring pagination (limit=100 max).
- Invalid filters (e.g., non-existent pool) - ensure graceful error handling.
- Network errors during fetch.

## Acceptance Criteria

- All proxy API calls in admin panel use documented endpoints and parameters.
- Dashboard loads 200 random or paginated proxies instead of undefined /sample endpoint.
- KPI components display accurate counts and stats with optional filters.
- No console errors from mismatched API responses.
- Frontend build succeeds without type errors.
- Manual testing shows map and KPIs update correctly with filtered data.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- Read apps/packages/admin/src/pages/Dashboard.tsx and verify fetch uses /v1/proxies with ?page and ?limit params.
- Read apps/packages/admin/src/DashboardKPI.tsx and confirm /v1/proxies/count and /v1/proxies/stats calls align with docs.
- cd apps/packages/admin && bun run build - Run frontend build to validate no errors from API changes.
- docker compose -f docker-compose.dev.yml exec api curl \"http://localhost:3000/v1/proxies?page=1&limit=10\" - Test backend endpoint responds correctly.
- Open http://localhost:4173 in browser, navigate to dashboard, and confirm proxies load with pagination support (check network tab).
- cd apps/packages/api && uv run pytest - Run server tests to validate the feature works with zero regressions (assuming API changes are compatible).

## Notes

- Ensure API_BASE is correctly defined in admin env.
- If stats or count endpoints need updates, align with any backend changes, but focus on client-side calls.
- Consider adding a shared API client utility for consistency in future updates.