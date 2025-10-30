# E2E Test: Proxy Delete API Error Fix

## Steps to Validate

1. Start the application: `docker compose up --build -d` and `docker compose exec api npx prisma migrate deploy`.
2. Add a test provider if none: Navigate to http://localhost:4173/providers, add "TestProvider" (type: manual, config: {\"test\": true}).
3. Manually add test proxies via API or curl (ensure 2-3 proxies exist with different IDs):
   ```
   curl -X POST http://localhost:3000/v1/proxies -H "Content-Type: application/json" -d '{\"host\":\"test1.proxy.com\",\"port\":8080,\"pool\":\"test\",\"providerId\":\"TEST_PROVIDER_ID\",\"score\":95,\"disabled\":false}'
   ```
   Add another for confirmation.
4. Navigate to http://localhost:4173/proxies. Verify page loads with proxies listed, no console errors.
5. Take screenshot of initial proxies table (before delete).
6. Click delete (Trash icon) on first proxy. Verify DeleteConfirmModal opens: "Are you sure... Item: test1.proxy.com".
7. Confirm delete (click Delete button). Verify:
   - Success message appears: "Proxy deleted successfully" (green banner).
   - Table updates: Removed proxy no longer listed, no errors in console/network (DELETE /v1/proxies/{id} returns 200).
   - No regressions: Other proxies remain, filters/search still work.
8. Take screenshot of updated table (proxy removed) and success message.
9. Attempt delete on remaining proxy: Confirm works similarly, table empties.
10. Take screenshot of empty table state: "No proxies found...".
11. Verify no console errors throughout, API calls succeed (check Network tab: DELETE 200 OK, no 500/404).
12. Toggle theme and resize to mobile: Ensure modal responsive, no layout errors.
13. Expected: Delete succeeds without API errors (e.g., no lease conflicts), UI feedback clear, zero regressions in listing/editing.

## Expected Screenshots
- Proxies table before delete (multiple rows).
- Delete confirmation modal.
- Post-delete table (one removed) with success banner.
- Empty table after all deletes.

## Validation
- Reproduce bug before (if possible, but assume fixed): Attempt delete prior to changes should error (e.g., Prisma relation violation); after, succeeds.
- Run `docker compose exec api npm run test` (API tests pass).
- `cd apps/packages/admin && bun run build` succeeds.
- Inspect DB: `docker compose exec api npx prisma studio` – Confirm proxies deleted, leases cleared (no orphans).