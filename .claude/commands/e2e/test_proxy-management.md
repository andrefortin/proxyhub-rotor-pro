# E2E Test: Proxy Management Page

## Test Steps

1. **Start the Admin UI**: Run `cd apps/packages/admin && bun dev` to start the development server. Verify it loads at http://localhost:4173.

2. **Navigate to Providers (Prerequisite)**: Go to http://localhost:4173/providers. If no providers exist, add a test provider:
   - Click "Add Provider".
   - Fill: Name: "TestProvider", Type: "manual", Config: `{"test": true}`, Active: checked.
   - Submit and verify success. Note the provider ID from table or console.

3. **Add Test Proxies**: Use browser dev tools or curl to add a proxy via API (since no bulk import UI yet):
   ```
   curl -X POST http://localhost:8080/v1/proxies \
   -H "Content-Type: application/json" \
   -d '{
     "host": "test.proxy.com",
     "port": 8080,
     "pool": "test",
     "providerId": "YOUR_PROVIDER_ID",
     "score": 95,
     "disabled": false
   }'
   ```
   Add 2-3 proxies with varying pools (e.g., "residential"), countries (if API supports).

4. **Navigate to Proxies Page**: Go to http://localhost:4173/proxies. Verify:
   - Page loads without errors.
   - Table shows added proxies (columns: Host:Port, Pool, Provider, Score, Status).
   - If empty, shows "No proxies found. Add one above!".
   - Screenshot: Full page with table (or empty state).

5. **Test Search and Filters**:
   - Enter search: "test" in search box. Verify table filters to test proxies.
   - Select filter: Pool = "test". Verify only test pool proxies show.
   - Clear filters. Screenshot: Filtered table.

6. **Test Add Proxy**:
   - Click "Add Proxy" button (top-right).
   - In modal: Host: "new.proxy.com", Port: 8081, Pool: "newpool", Provider: TestProvider, Score: auto or input if added, Active: checked.
   - Submit. Verify success toast/alert, refetch shows new proxy.
   - Screenshot: Modal form and updated table.

7. **Test Edit Proxy**:
   - Click Edit on a proxy (e.g., change pool to "edited").
   - Modal opens with pre-filled data.
   - Update Pool, submit. Verify table updates (optimistic then confirmed).
   - Screenshot: Before/after table row.

8. **Test Proxy**:
   - Click "Test" button on a proxy.
   - Verify modal shows lease results (e.g., "Proxy string: http://... Status: OK" or error if unavailable).
   - If success, note no change to table (or update score if implemented).
   - Screenshot: Test modal with results.

9. **Test Delete**:
   - Click Delete on a proxy. Confirm dialog: "Delete this proxy? This is irreversible."
   - Confirm. Verify proxy removed from table, no errors.
   - Screenshot: Confirm dialog and updated table (empty or remaining).

10. **Test Theme Toggle**:
    - In header, click theme toggle (sun/moon icon).
    - Switch light/dark. Verify table colors adapt (e.g., dark mode: dark backgrounds, light text).
    - Hover on a row: Verify bg-accent (subtle highlight).
    - Screenshot: Table in light mode, then dark mode.

11. **Micro-Interactions Check**:
    - Hover table row: Subtle highlight (bg-accent).
    - Hover buttons: Scale or color change (e.g., primary/90).
    - Toggle status switch: Smooth animation.
    - Loading: Refresh page, verify skeleton or spinner during fetch.

## Expected Outcomes

- All CRUD operations succeed without console errors.
- Filters/search update table dynamically.
- Test button issues valid lease or handles errors gracefully.
- UI responsive in both themes, tooltips visible on hover (e.g., score explanation).
- No regressions: Re-navigate to /providers, verify unchanged.
- Screenshots prove visual functionality.

## Validation

- Run `cd apps/packages/admin && bun tsc --noEmit` – No TS errors.
- Manually inspect console/network: All API calls 200 OK, no CORS.
- If issues: Check backend running (`docker compose up` in root), API endpoints respond.

This test validates core Proxy Management UI works end-to-end for non-technical users.