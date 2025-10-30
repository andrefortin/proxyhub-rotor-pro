# E2E Test: Dashboard API Updates

Test that the admin dashboard API calls align with Swagger documentation after updates.

## User Story

As an admin user
I want the dashboard to make correct API calls per Swagger specs
So that data loads accurately with proper pagination and filters.

## Test Steps

1. Navigate to the Application URL (http://localhost:4173/dashboard)
2. Take a screenshot of the initial dashboard state
3. **Verify** the page loads without errors and KPIs (proxies count, usage summary, pools stats) display initial data or loading states
4. Check the browser Network tab for /v1/proxies?page=1&limit=200 request; **verify** it succeeds with {items, total, page, limit} response structure
5. Take a screenshot of the loaded KPIs
6. Navigate to /providers page
7. Take a screenshot of the providers table initial state
8. **Verify** the Network tab shows /v1/providers?page=1&limit=10 (or search if applied) with correct response; check if pagination uses total for navigation
9. Click to next page if data exists; **verify** ?page=2 request
10. Take a screenshot of providers pagination working
11. Navigate back to /dashboard and check UsageChart
12. **Verify** /v1/usage/stats request in Network tab and chart renders data
13. Take a screenshot of the usage chart
14. Open browser console; **verify** no API-related errors (e.g., 400 from invalid params)
15. Refresh pages; **verify** no regressions in loading

## Success Criteria

- All specified API calls use page/limit params, not skip/take
- Responses parsed correctly (e.g., items from total > 0)
- UI renders without console/network errors
- Pagination works in providers table
- 4 screenshots taken: initial dashboard, KPIs, providers table/pagination, usage chart
- Test passes if all verifications hold; fail otherwise with error details