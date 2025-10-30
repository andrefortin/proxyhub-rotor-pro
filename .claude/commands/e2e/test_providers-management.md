# E2E Test: Providers Management

## Steps to Validate

1. Run `docker compose -f docker-compose.dev.yml up --build -d` to start services.
2. Open browser to http://localhost:4173/providers?mock=true.
3. Open DevTools Console and verify no errors in console log.
4. Verify Providers page loads with sidebar link highlighted.
5. Take a screenshot of the table with mock data (3 providers visible).
6. Toggle Mock Mode off - page reloads with ?mock=false, verify real (empty) table shows "No providers found".
7. Verify no errors in console after reload.
8. Click "Add Provider", fill form: Name "Test API", Type "api", Config `{\"kind\": \"test\"}`, submit - verify new row appears in table.
9. Verify no errors in console after add.
10. Click Edit on Test API, change Name to "Updated Test", submit - verify updated in table.
11. Verify no errors in console after edit.
12. Click Delete on a provider, confirm dialog, submit - verify removed from table.
13. Verify no errors in console after delete.
14. Take screenshot of empty table after delete all.
15. Expected: No unintended errors in browser console throughout the test, CRUD works in mock/real modes, responsive on mobile (resize window to mobile view and confirm no console errors).

## Expected Screenshots
- Providers table with mock data.
- Add form submission success.
- Post-delete empty state.