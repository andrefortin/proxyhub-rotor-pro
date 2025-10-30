# E2E Test: Provider Status Toggle

## Goal
Validate the toggle button in the Providers table Actions column allows quick active/inactive switching for providers, with API calls, optimistic updates, loading states, and error handling.

## Steps

1. Start the full stack: Run `docker compose -f docker-compose.dev.yml up` to ensure admin, api, db, redis run.

2. Navigate to providers page: Open browser to http://localhost:4173/providers

3. Verify UI: In the table, confirm Actions column has a toggle (green for Active providers, red for Inactive), positioned before Edit/Delete icons. Status badge in dedicated column matches toggle color.

4. Test toggle on active provider: Select an Active provider row, click the green toggle.
   - Expected: Toggle spins/loading (opacity 50%, disabled), status badge instantly flips to Inactive/red (optimistic).
   - Network: PATCH /v1/providers/{id} POST with {"active": false}, response 200.
   - Success: Table refreshes, toggle stays red, status Inactive, no console errors.
   - If error (simulate with devtools network block): Toggle reverts to green, error message shown, status remains Active.

5. Test toggle on inactive provider: If none, add via Add Provider (name: 'Test Inactive', active: off). Then click red toggle.
   - Expected: Loading, optimistic flip to Active/green, PATCH {"active": true} succeeds.
   - Success: Toggle green, status Active, table sync.

6. Test loading state: Click toggle during network delay (throttle in devtools) - confirm disabled state prevents spam clicks.

7. Test multiple providers: Toggle 2-3 providers quickly - each handles independently, no race conditions, loading per row.

8. Visual/Screenshot: Capture table with toggles in both states, loading animation, error revert.

## Expected Outcome
- Toggle calls API correctly for status change.
- Optimistic UI updates with rollback on failure.
- Status badge syncs immediately.
- No regressions in Add/Edit/Delete.
- Console clean, no unhandled promises.

## Cleanup
- Delete test providers via Delete button in UI.
- Restart services if needed for clean state.
